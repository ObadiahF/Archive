import path from "node:path"
import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    restoreMocks: true,
    clearMocks: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/test/**",
        "src/main.tsx",
        "src/**/*.d.ts",
        "src/components/ui/**",
        // Type-only declarations have no runtime to cover.
        "src/api/types.ts",
        // The FileBrowser is the top-level orchestrator. Its real-world
        // behavior (navigation, dialogs, drag/drop upload, deletion) is
        // exercised end-to-end by the Playwright auth/crud/upload specs;
        // unit-testing it would duplicate that surface with a heavy mock
        // graph for diminishing return.
        "src/components/FileBrowser.tsx",
        // Thin wrappers around @uiw/react-codemirror and shiki. Useful
        // coverage requires loading those libs; behavior is verified by
        // the PreviewDialog tests and E2E preview flow.
        "src/components/previews/CodeEditor.tsx",
        "src/components/previews/CodePreview.tsx",
      ],
      thresholds: {
        lines: 80,
        statements: 80,
        // v8 counts each inline event handler as a separate function, so
        // component-heavy code reads low even when behavior is well-tested.
        functions: 70,
        branches: 75,
      },
    },
  },
})
