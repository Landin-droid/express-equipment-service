import fs from "fs";
import path from "path";

export function createJsonFileStore(fileName) {
  const dataDir = path.resolve("data");
  const filePath = path.join(dataDir, fileName);

  function ensureFile() {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, "[]", "utf-8");
    }
  }

  function load() {
    ensureFile();
    const raw = fs.readFileSync(filePath, "utf-8");
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  function save(items) {
    ensureFile();
    fs.writeFileSync(filePath, JSON.stringify(items, null, 2), "utf-8");
  }

  return { load, save };
}
