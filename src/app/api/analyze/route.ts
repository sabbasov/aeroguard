import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { fetchFAARegistry } from "@/lib/faaRegistry";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const SYSTEM_PROMPT = `You are an FAA-certified Maintenance Inspector. Compare the provided Serial Number against the "Applicability" section of the AD. Determine if the aircraft falls within the affected range. Return a JSON with: "applicable" (boolean), "confidence" (0-100), and "reasoning" (e.g., "Serial Number 36617 falls within range 36216-36769").`;

interface GeminiResult {
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
    return text.slice(0, 6000);
  } catch {
    return "";
  }
}

async function analyzeWithGemini(
  serialNumber: string,
  model: string,
  adNumber: string,
  adText: string
): Promise<GeminiResult> {
  const fallback: GeminiResult = {
    applicable: false,
    confidence: 0,
    reasoning: "LLM analysis unavailable — could not reach Gemini API.",
  };

  if (!adText) {
    return {
      applicable: false,
      confidence: 0,
      reasoning: "AD text could not be retrieved for analysis.",
    };
  }

  try {
    const userPrompt = `Aircraft Serial Number: ${serialNumber}\nAircraft Model: ${model}\nAD Number: ${adNumber}\n\nAD Full Text:\n${adText}`;

    const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ parts: [{ text: userPrompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      console.error("Gemini API error:", res.status, await res.text());
      return fallback;
    }

    const data = await res.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const parsed: GeminiResult = JSON.parse(raw);
    return {
      applicable: !!parsed.applicable,
      confidence: Math.min(Math.max(parsed.confidence ?? 0, 0), 100),
      reasoning: parsed.reasoning || "No reasoning provided.",
    };
  } catch (err) {
    console.error("Gemini parse error:", err);
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

    const registry = await fetchFAARegistry(nNumber);
    const serialNumber = registry?.serialNumber ?? "UNKNOWN";
    const modelRaw = registry?.model ?? "";

    // ── SDR Query ──
    const { data: tailMatches, error: tailError } = await supabaseAdmin
      .from("sdr_reports")
      .select("*")
      .ilike("tail_number", nNumber)
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
        .ilike("aircraft_model", `%${model}%`)
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
          const result = await analyzeWithGemini(
            serialNumber,
            modelRaw,
            ad.ad_number,
            adText
          );
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
