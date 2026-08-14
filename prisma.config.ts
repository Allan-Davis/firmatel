// prisma.config.ts
//
// PRISMA 7 CHANGE: your project already has this file (that's why
// the CLI said "Loaded Prisma config from prisma.config.ts"), but it
// wasn't yet telling Prisma where your database actually is. That's
// the missing piece causing the P1012 error.
//
// IMPORTANT: open your EXISTING prisma.config.ts first. If it already
// has content (e.g. a `migrations` or `schema` block), don't replace
// the whole file — just add the `datasource` block shown below into
// it. If your prisma.config.ts is empty/default, you can replace it
// with this file entirely.

import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});