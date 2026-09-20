const fs = require("fs");
const path = require("path");

module.exports = async () => {
  const testDataDir = path.resolve("data/test");
  fs.rmSync(testDataDir, { recursive: true, force: true });
};
