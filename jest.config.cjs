process.env.NODE_ENV = "test";
process.env.API_KEY = "test-api-key";

module.exports = {
  testEnvironment: "node",
  globalSetup: "./tests/globalSetup.cjs",
  testTimeout: 10000,
};
