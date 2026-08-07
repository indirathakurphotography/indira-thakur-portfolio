import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const results: Record<string, unknown> = {};
  results.migration_key_set = !!process.env.MIGRATION_KEY;
  results.migration_key_length = (process.env.MIGRATION_KEY || "").length;
  results.query_key_provided = !!request.nextUrl.searchParams.get("key");
  results.query_key_matches = request.nextUrl.searchParams.get("key") === process.env.MIGRATION_KEY;
  try {
    const bcrypt = await import("bcryptjs");
    results.bcrypt_imported = true;
    try {
      const hash = await bcrypt.default.hash("test", 12);
      results.hash_worked = true;
      results.hash_length = hash.length;
      const match = await bcrypt.default.compare("test", hash);
      results.compare_worked = match;
    } catch (e: any) {
      results.bcrypt_error = e.message;
    }
  } catch (e: any) {
    results.bcrypt_import_error = e.message;
  }
  try {
    const { connectToDatabase } = await import("@/lib/mongodb");
    await connectToDatabase();
    const User = (await import("@/models/User")).default;
    const admin = await User.findOne({ email: "admin@indirathakur.com" });
    if (admin) {
      results.admin_found = true;
      try {
        const match = await admin.comparePassword("admin123");
        results.password_match = match;
      } catch (e: any) {
        results.compare_error = e.message;
      }
    }
  } catch (e: any) {
    results.db_error = e.message;
  }
  return NextResponse.json(results);
}
