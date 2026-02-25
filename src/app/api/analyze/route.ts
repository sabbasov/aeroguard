import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

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

    const { data: tailMatches, error: tailError } = await supabase
      .from("sdr_reports")
      .select("*")
      .ilike("tail_number", normalizedTail)
      .order("difficulty_date", { ascending: false })
      .limit(100);

    if (tailError) {
      console.error("tail_number query failed:", tailError);
      return NextResponse.json(
        { error: "Failed to query SDR reports." },
        { status: 502 }
      );
    }

    if (tailMatches && tailMatches.length > 0) {
      return NextResponse.json({
        tailNumber: normalizedTail,
        matchType: "tail_number",
        count: tailMatches.length,
        reports: tailMatches,
      });
    }

    // Fallback: Cessna 172 model-wide reports
    const { data: modelMatches, error: modelError } = await supabase
      .from("sdr_reports")
      .select("*")
      .ilike("aircraft_model", "%172%")
      .order("difficulty_date", { ascending: false })
      .limit(50);

    if (modelError) {
      console.error("model fallback query failed:", modelError);
      return NextResponse.json(
        { error: "Failed to query fallback SDR reports." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      tailNumber: normalizedTail,
      matchType: "model_fallback",
      message:
        "No records found for this tail number. Showing general Cessna 172 reports.",
      count: modelMatches?.length ?? 0,
      reports: modelMatches ?? [],
    });
  } catch (err) {
    console.error("analyze:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
