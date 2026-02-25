import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { fetchFAARegistry } from "@/lib/faaRegistry";

const AD_MODELS = ["172M", "172N"];
const AD_76_21_06 = {
  adNumber: "76-21-06",
  subject: "Bendix Magneto Impulse Coupling",
  models: AD_MODELS,
  status: "Potential Requirement",
  pdfPath: "/DRS_76-21-06.pdf",
};

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

    const { data: tailMatches, error: tailError } = await supabase
      .from("sdr_reports")
      .select("*")
      .ilike("tail_number", nNumber)
      .order("difficulty_date", { ascending: false })
      .limit(100);

    if (tailError) {
      console.error("tail_number query failed:", tailError);
    }

    let reports = tailMatches ?? [];
    let matchType = "tail_number";

    if (reports.length === 0) {
      const model = registry?.model ?? "172";
      const { data: modelMatches } = await supabase
        .from("sdr_reports")
        .select("*")
        .ilike("aircraft_model", `%${model}%`)
        .order("difficulty_date", { ascending: false })
        .limit(50);

      reports = modelMatches ?? [];
      matchType = "model_fallback";
    }

    // Top 3 most common part failures
    const partCounts: Record<string, number> = {};
    for (const r of reports) {
      const name = r.part_name;
      if (name) partCounts[name] = (partCounts[name] || 0) + 1;
    }
    const topFailures = Object.entries(partCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([partName, count]) => ({ partName, count }));

    // AD applicability check
    const registryModel = registry?.model?.toUpperCase() ?? "";
    const adApplicable = AD_MODELS.some((m) => registryModel.includes(m));
    const ads = adApplicable ? [AD_76_21_06] : [];

    // Risk score: base 10, +40 per AD, +10 per FAILED/CRACKED, +2 per EXCESS WEAR
    const failedCount = reports.filter((r) => {
      const cond = r.part_condition?.toUpperCase() ?? "";
      return cond === "FAILED" || cond === "CRACKED";
    }).length;
    const excessWearCount = reports.filter(
      (r) => r.part_condition?.toUpperCase() === "EXCESS WEAR"
    ).length;
    const rawScore = 10 + ads.length * 40 + failedCount * 10 + excessWearCount * 2;
    const riskScore = Math.min(rawScore, 100);

    return NextResponse.json({
      tailNumber: normalizedTail,
      matchType,
      registry: registry ?? null,
      count: reports.length,
      reports,
      topFailures,
      ads,
      riskScore,
      failedCount,
      excessWearCount,
    });
  } catch (err) {
    console.error("analyze:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
