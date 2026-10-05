process.env.NODE_ENV = "test";
process.env.API_KEY = "test-api-key";

module.exports = {
  testEnvironment: "node",
  globalSetup: "./tests/globalSetup.cjs",
  setupFilesAfterEnv: ["<rootDir>/tests/setupAfterEnv.mjs"],
  testTimeout: 15000,
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["text", "html"],
};
