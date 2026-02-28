import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { fetchFAARegistry } from "@/lib/faaRegistry";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

const TAIL_NUMBER_RE = /^[A-Z0-9]{1,6}$/;
const ALLOWED_AD_HOSTS = ["www.federalregister.gov", "rgl.faa.gov", "drs.faa.gov"];

/** Escape special LIKE/ILIKE pattern characters so they match literally. */
function escapeLikePattern(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}

interface AnalysisResult {
  applicable: boolean;
  confidence: number;
  reasoning: string;
}

interface ADWithAnalysis {
  adNumber: string;
  subject: string;
  adLink: string | null;
  applicable: boolean;
  confidence: number;
  reasoning: string;
}

async function fetchADContent(url: string): Promise<string> {
  try {
    const parsed = new URL(url);
    if (
      parsed.protocol !== "https:" ||
      !ALLOWED_AD_HOSTS.includes(parsed.hostname)
    ) {
      return "";
    }
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return "";
    const html = await res.text();
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, " ")
      .trim();
    
    // Try to extract REGULATORY TEXT section first (contains most detailed info)
    const regMatch = text.match(/REGULATORY\s+TEXT[:\s]+([\s\S]*?)(?=EFFECTIVE|SUMMARY|BACKGROUND|$)/i);
    if (regMatch && regMatch[1].length > 100) {
      return regMatch[1].slice(0, 4000).trim();
    }
    
    // Try Applicability section
    const appMatch = text.match(/Applicability[:\s]+([\s\S]*?)(?=Effective|For Action|Special|REGULATORY|$)/i);
    if (appMatch && appMatch[1].length > 100) {
      return appMatch[1].slice(0, 4000).trim();
    }
    
    // Fallback to first 4000 chars
    return text.slice(0, 4000);
  } catch {
    return "";
  }
}

async function analyzeADLocally(
  serialNumber: string,
  model: string,
  adNumber: string,
  adText: string
): Promise<AnalysisResult> {
  if (!adText || adText.length < 20) {
    return {
      applicable: false,
      confidence: 0,
      reasoning: "Insufficient AD data for analysis.",
    };
  }

  const textUpper = adText.toUpperCase();
  const serialUpper = serialNumber.toUpperCase();
  const serial = parseInt(serialNumber);

  // Pattern 1: Explicit range "Serial numbers XXXXX through XXXXX"
  const rangeMatch = textUpper.match(/serial\s+(?:numbers?)?\s*(\d+)\s+(?:through|thru|-|to)\s+(\d+)/i);
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1]);
    const end = parseInt(rangeMatch[2]);
    
    if (!isNaN(serial) && !isNaN(start) && !isNaN(end)) {
      if (serial >= start && serial <= end) {
        return {
          applicable: true,
          confidence: 95,
          reasoning: `Serial Number ${serialNumber} falls within the affected range ${start}-${end}.`,
        };
      } else {
        return {
          applicable: false,
          confidence: 90,
          reasoning: `Serial Number ${serialNumber} is outside the affected range ${start}-${end}.`,
        };
      }
    }
  }

  // Pattern 2: "All serial numbers" or "all aircraft"
  if (/all\s+(?:serial\s+)?numbers|all\s+aircraft|all\s+airplanes|all\s+cessna/i.test(textUpper)) {
    return {
      applicable: true,
      confidence: 90,
      reasoning: `AD applies to all ${model} aircraft.`,
    };
  }

  // Pattern 3: Specific serial number match
  if (textUpper.includes(serialUpper)) {
    return {
      applicable: true,
      confidence: 85,
      reasoning: `Serial Number ${serialNumber} is specifically mentioned in AD.`,
    };
  }

  // Pattern 4: Model/series specific without exclusions
  if (/(?:cessna|model)\s+172|172\s+series/i.test(textUpper) && !/except|exclude|not applicable|not affected/i.test(textUpper)) {
    return {
      applicable: true,
      confidence: 75,
      reasoning: `AD applies to Cessna 172 series aircraft.`,
    };
  }

  // Pattern 5: Look for exclusion patterns
  if (/not\s+applicable|does\s+not\s+apply|excluded|exception|not\s+affected/i.test(textUpper)) {
    return {
      applicable: false,
      confidence: 70,
      reasoning: "AD contains exclusion criteria.",
    };
  }

  // Pattern 6: S/N ranges with hyphens or "through"
  const complexRangeMatch = textUpper.match(/s\.?n\.?\s*(?:ranges?|from)?\s*(\d+)\s*[-–]\s*(\d+)/i);
  if (complexRangeMatch) {
    const start = parseInt(complexRangeMatch[1]);
    const end = parseInt(complexRangeMatch[2]);
    if (!isNaN(serial) && !isNaN(start) && !isNaN(end)) {
      if (serial >= start && serial <= end) {
        return {
          applicable: true,
          confidence: 92,
          reasoning: `Serial Number ${serialNumber} falls within range ${start}-${end}.`,
        };
      }
    }
  }

  // Default: Unable to determine - return low confidence for Gemini fallback
  return {
    applicable: false,
    confidence: 30,
    reasoning: "Applicability could not be determined from available text.",
  };
}

// Fallback to Gemini for better analysis
async function analyzeADWithGemini(
  serialNumber: string,
  model: string,
  adNumber: string,
  adText: string
): Promise<AnalysisResult> {
  const fallback: AnalysisResult = {
    applicable: false,
    confidence: 0,
    reasoning: "Analysis unavailable.",
  };

  if (!adText || !GEMINI_API_KEY) return fallback;

  try {
    const prompt = `Analyze if aircraft serial number ${serialNumber} (${model}) is affected by AD ${adNumber}.

AD Applicability Text:
${adText}

Return ONLY this JSON format: {"applicable": boolean, "confidence": number (0-100), "reasoning": string (short sentence)}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { 
            responseMimeType: "application/json", 
            temperature: 0.1,
            maxOutputTokens: 200
          },
        }),
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!res.ok) {
      console.error(`Gemini API error for ${adNumber}:`, res.status, await res.text());
      return fallback;
    }
    
    const data = await res.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    if (!raw) return fallback;
    
    const parsed = JSON.parse(raw);
    return {
      applicable: !!parsed.applicable,
      confidence: Math.min(Math.max(parsed.confidence ?? 0, 0), 100),
      reasoning: parsed.reasoning || "No reasoning provided.",
    };
  } catch (err) {
    console.error(`Gemini parse error for ${adNumber}:`, err);
    return fallback;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tailNumber } = body;

    if (!tailNumber || typeof tailNumber !== "string") {
      return NextResponse.json(
        { error: "Aircraft tail number is required." },
        { status: 400 }
      );
    }

    const normalizedTail = tailNumber.trim().toUpperCase();
    const nNumber = normalizedTail.replace(/^N/, "");

    if (!TAIL_NUMBER_RE.test(nNumber)) {
      return NextResponse.json(
        { error: "Invalid tail number format." },
        { status: 400 }
      );
    }

    const registry = await fetchFAARegistry(nNumber);
    const serialNumber = registry?.serialNumber ?? "UNKNOWN";
    const modelRaw = registry?.model ?? "";

    // ── SDR Query ──
    const { data: tailMatches, error: tailError } = await supabaseAdmin
      .from("sdr_reports")
      .select("*")
      .ilike("tail_number", escapeLikePattern(nNumber))
      .order("difficulty_date", { ascending: false })
      .limit(100);

    if (tailError) console.error("tail_number query failed:", tailError);

    let reports = tailMatches ?? [];
    let matchType = "tail_number";

    if (reports.length === 0) {
      const model = modelRaw || "172";
      const { data: modelMatches } = await supabaseAdmin
        .from("sdr_reports")
        .select("*")
        .ilike("aircraft_model", `%${escapeLikePattern(model)}%`)
        .order("difficulty_date", { ascending: false })
        .limit(50);

      reports = modelMatches ?? [];
      matchType = "model_fallback";
    }

    // Top 3 failures
    const partCounts: Record<string, number> = {};
    for (const r of reports) {
      const name = r.part_name;
      if (name) partCounts[name] = (partCounts[name] || 0) + 1;
    }
    const topFailures = Object.entries(partCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([partName, count]) => ({ partName, count }));

    // ── AD lookup via ad_model_mapping ──
    const modelUpper = modelRaw.toUpperCase().replace(/\s+/g, "");
    const modelBase = modelUpper.replace(/[A-Z]+$/, "");
    const modelVariants = [modelUpper, modelBase].filter(Boolean);

    let adNumbers: string[] = [];
    if (modelVariants.length > 0) {
      const { data: mappings } = await supabaseAdmin
        .from("ad_model_mapping")
        .select("ad_number")
        .in("model_name", modelVariants);

      adNumbers = [...new Set((mappings ?? []).map((m) => m.ad_number))];
    }

    // Fetch AD details (subject + link)
    let adDetails: { ad_number: string; subject: string; ad_link: string | null }[] = [];
    if (adNumbers.length > 0) {
      const { data } = await supabaseAdmin
        .from("airworthiness_directives")
        .select("ad_number, subject, ad_link")
        .in("ad_number", adNumbers);

      adDetails = data ?? [];
    }

    // Pick top 5 ADs, prioritize those with "Safety" in subject
    const sorted = [...adDetails].sort((a, b) => {
      const aScore = /safety|emergency|unsafe/i.test(a.subject ?? "") ? 1 : 0;
      const bScore = /safety|emergency|unsafe/i.test(b.subject ?? "") ? 1 : 0;
      return bScore - aScore;
    });
    const topADs = sorted.slice(0, 5);

    // ── RAG: fetch AD content + LLM analysis ──
    const analyzedADs: ADWithAnalysis[] = [];

    if (serialNumber !== "UNKNOWN" && topADs.length > 0) {
      const analyses = await Promise.all(
        topADs.map(async (ad) => {
          const adText = ad.ad_link ? await fetchADContent(ad.ad_link) : "";
          // Try local analysis first
          let result = await analyzeADLocally(
            serialNumber,
            modelRaw,
            ad.ad_number,
            adText
          );
          // Always use Gemini if confidence is below 80%
          if (result.confidence < 80 && adText.length > 20 && GEMINI_API_KEY) {
            const geminiResult = await analyzeADWithGemini(
              serialNumber,
              modelRaw,
              ad.ad_number,
              adText
            );
            // Use Gemini if it returns a result
            if (geminiResult.confidence > 0 || geminiResult.applicable) {
              result = geminiResult;
            }
          }
          return {
            adNumber: ad.ad_number,
            subject: ad.subject ?? "",
            adLink: ad.ad_link,
            applicable: result.applicable,
            confidence: result.confidence,
            reasoning: result.reasoning,
          };
        })
      );
      analyzedADs.push(...analyses);
    } else if (topADs.length > 0) {
      for (const ad of topADs) {
        analyzedADs.push({
          adNumber: ad.ad_number,
          subject: ad.subject ?? "",
          adLink: ad.ad_link,
          applicable: false,
          confidence: 0,
          reasoning: "Serial number not available from FAA Registry — manual review required.",
        });
      }
    }

    // ── Risk score ──
    const applicableCount = analyzedADs.filter((a) => a.applicable).length;
    const failedCount = reports.filter((r) => {
      const cond = r.part_condition?.toUpperCase() ?? "";
      return cond === "FAILED" || cond === "CRACKED";
    }).length;
    const excessWearCount = reports.filter(
      (r) => r.part_condition?.toUpperCase() === "EXCESS WEAR"
    ).length;

    const rawScore =
      10 +
      applicableCount * 40 +
      failedCount * 10 +
      excessWearCount * 2;
    const riskScore = Math.min(rawScore, 100);

    return NextResponse.json({
      tailNumber: normalizedTail,
      matchType,
      registry: registry ?? null,
      count: reports.length,
      reports,
      topFailures,
      ads: analyzedADs,
      riskScore,
      failedCount,
      excessWearCount,
      applicableCount,
      totalADsMatched: adNumbers.length,
    });
  } catch (err) {
    console.error("analyze:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
