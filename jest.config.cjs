process.env.NODE_ENV = "test";
process.env.LOG_LEVEL = "silent";
process.env.DOTENV_CONFIG_QUIET = "true";

module.exports = {
  testEnvironment: "node",
  globalSetup: "./tests/globalSetup.cjs",
  setupFilesAfterEnv: ["<rootDir>/tests/setupAfterEnv.mjs"],
  testTimeout: 15000,
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["text", "html"],
};
