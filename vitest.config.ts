// The action test suite talks to a real Postgres database. Before running
// `npm run test`, make sure a local Postgres instance (or a dedicated Neon
// branch) is reachable at the `.env.test` DATABASE_URL. One way to get a
// local instance:
//   docker run -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:16
import path from "node:path";
import { defineConfig } from "vitest/config";
import { config } from "dotenv";

config({ path: ".env.test" });

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    globals: true,
  },
});
