import fs from "fs";
import path from "path";
import initSqlJs from "sql.js";

let SQL: any = null;

export async function openDatabase(filename: string) {
  if (!SQL) {
    SQL = await initSqlJs({
      locateFile: (file: string) =>
        path.join(process.cwd(), "node_modules", "sql.js", "dist", file),
    });
  }

  const dbPath = path.join(process.cwd(), filename);
  const dbBuffer = fs.readFileSync(dbPath);
  return new SQL.Database(dbBuffer);
}
