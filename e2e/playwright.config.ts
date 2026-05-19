import { defineConfig, devices } from "@playwright/test"
import path from "node:path"

const FRONTEND_PORT = Number(process.env.E2E_FRONTEND_PORT ?? 5173)
const BACKEND_PORT = Number(process.env.E2E_BACKEND_PORT ?? 3000)
const STORAGE_DIR = path.resolve(__dirname, ".e2e-storage")

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"], ["html", { open: "never" }]],

  use: {
    baseURL: `http://localhost:${FRONTEND_PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: [
    {
      command: "npm run dev",
      cwd: path.resolve(__dirname, "../backend"),
      env: {
        PORT: String(BACKEND_PORT),
        STORAGE_ROOT: STORAGE_DIR,
        AUTH_USERNAME: "e2euser",
        AUTH_PASSWORD: "e2epass",
        JWT_SECRET: "e2e-secret-do-not-use-in-prod",
        JWT_TTL_HOURS: "1",
        MAX_FILE_BYTES: String(10 * 1024 * 1024),
        MAX_FILES_PER_REQUEST: "10",
      },
      url: `http://localhost:${BACKEND_PORT}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      stdout: "pipe",
      stderr: "pipe",
    },
    {
      command: "npm run dev",
      cwd: path.resolve(__dirname, "../frontend"),
      env: {
        VITE_API_PROXY_TARGET: `http://localhost:${BACKEND_PORT}`,
      },
      url: `http://localhost:${FRONTEND_PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
})
