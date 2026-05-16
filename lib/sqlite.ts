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

  const publicDbPath = path.join(process.cwd(), "public", filename);
  const localDbPath = path.join(process.cwd(), filename);
  const dbPath = fs.existsSync(publicDbPath) ? publicDbPath : localDbPath;

  if (!fs.existsSync(dbPath)) {
    throw new Error(`SQLite database not found at ${publicDbPath} or ${localDbPath}`);
  }

  const dbBuffer = fs.readFileSync(dbPath);
  return new SQL.Database(dbBuffer);
}
