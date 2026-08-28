import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // jsdom (not the vitest default "node") because srsStore.ts uses
    // the real `localStorage` global - see tests/srsStore.test.ts.
    environment: "jsdom",
    include: ["tests/**/*.test.ts"]
  }
});
