/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/tests/**/*.test.ts"],
  setupFiles: ["<rootDir>/tests/setup.ts"],
  globalSetup: "<rootDir>/tests/globalSetup.ts",
  globalTeardown: "<rootDir>/tests/globalTeardown.ts",
  clearMocks: true,
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/index.ts",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "html", "lcov"],
  coverageThreshold: {
    global: {
      lines: 80,
      statements: 80,
      functions: 80,
      branches: 70,
    },
  },
  projects: [
    {
      displayName: "unit",
      preset: "ts-jest",
      testEnvironment: "node",
      testMatch: ["<rootDir>/tests/unit/**/*.test.ts"],
      setupFiles: ["<rootDir>/tests/setup.ts"],
    },
    {
      displayName: "integration",
      preset: "ts-jest",
      testEnvironment: "node",
      testMatch: ["<rootDir>/tests/integration/**/*.test.ts"],
      setupFiles: ["<rootDir>/tests/setup.ts"],
      globalSetup: "<rootDir>/tests/globalSetup.ts",
      globalTeardown: "<rootDir>/tests/globalTeardown.ts",
    },
  ],
};
