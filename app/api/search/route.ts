import { NextRequest, NextResponse } from "next/server";
import { openDatabase } from "@/lib/sqlite";
import path from "path";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query || query.length < 1) {
      return NextResponse.json([]);
    }

    // Open database
    const db = await openDatabase("data/wilayah.db");

    try {
      // Normalize search query to lowercase
      const searchQuery = `%${query.toLowerCase()}%`;

      // Search for village-level locations (4-part codes like 81.05.12.2007)
      // Only return locations that have all hierarchical info populated
      // Search across multiple fields with ranking based on match location
      const stmt = db.prepare(`
        SELECT
          kode, nama, province_name, district_name, sub_district_name,
          CASE
            WHEN LOWER(province_name) LIKE ? THEN 1
            WHEN LOWER(district_name) LIKE ? THEN 2
            WHEN LOWER(sub_district_name) LIKE ? THEN 3
            WHEN LOWER(nama) LIKE ? THEN 4
            WHEN LOWER(keyword) LIKE ? THEN 5
            ELSE 6
          END as match_priority
        FROM wilayah
        WHERE (LOWER(nama) LIKE ? OR
               LOWER(sub_district_name) LIKE ? OR
               LOWER(district_name) LIKE ? OR
               LOWER(province_name) LIKE ? OR
               LOWER(keyword) LIKE ?)
          AND province_name IS NOT NULL
          AND province_name != ''
          AND district_name IS NOT NULL
          AND district_name != ''
          AND sub_district_name IS NOT NULL
          AND sub_district_name != ''
        ORDER BY match_priority ASC, nama ASC
        LIMIT 100
      `);
      const bindValues = Array(10).fill(searchQuery);
      stmt.bind(bindValues);

      const results: Array<{
        kode: string;
        nama: string;
        province_name: string;
        district_name: string;
        sub_district_name: string;
        match_priority: number;
      }> = [];

      while (stmt.step()) {
        results.push(stmt.getAsObject() as any);
      }
      stmt.free();

      // Filter results to only include village-level codes (4 parts: XX.XX.XX.XXXX)
      const validResults = results.filter((loc) => {
        const codeParts = loc.kode.split(".");
        return codeParts.length === 4;
      });

      // Format results with hierarchical information and match field
      const formattedResults = validResults.map((loc) => ({
        id: loc.kode,
        display_name: loc.nama,
        province: loc.province_name,
        district: loc.district_name,
        sub_district: loc.sub_district_name,
        full_path: `${loc.province_name}, ${loc.district_name}, ${loc.sub_district_name}, ${loc.nama}`,
        match_field: loc.match_priority === 1 ? 'province' :
                     loc.match_priority === 2 ? 'district' :
                     loc.match_priority === 3 ? 'sub_district' :
                     loc.match_priority === 4 ? 'village' : 'keyword',
      }));

      return NextResponse.json(formattedResults);
    } finally {
      db.close();
    }
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}

