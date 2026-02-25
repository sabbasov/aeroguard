import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    const [sdrResult, adResult] = await Promise.all([
      supabaseAdmin.from("sdr_reports").select("*", { count: "exact", head: true }),
      supabaseAdmin
        .from("airworthiness_directives")
        .select("*", { count: "exact", head: true }),
    ]);

    const sdrCount = sdrResult.count ?? 0;
    const adCount = adResult.count ?? 0;
    const supabaseOk = !sdrResult.error && !adResult.error;

    return NextResponse.json({
      sdrCount,
      adCount,
      aircraftTracked: 56041,
      supabaseOk,
    });
  } catch {
    return NextResponse.json({
      sdrCount: 0,
      adCount: 0,
      aircraftTracked: 56041,
      supabaseOk: false,
    });
  }
}
