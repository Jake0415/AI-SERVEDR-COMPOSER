import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Docker 환경에서는 .env.production 사용, 로컬에서는 .env.local이 우선 적용
config({ path: ".env.production" });
config({ path: ".env.local", override: true });

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  schemaFilter: ["ai_server_composer"],
});
