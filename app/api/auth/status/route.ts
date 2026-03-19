import { db, users } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function GET() {
  const result = await db.select({ count: sql<number>`count(*)` }).from(users);
  const userCount = result[0]?.count ?? 0;
  return Response.json({ initialized: userCount > 0 });
}
