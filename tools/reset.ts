import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";

const main = async () => {
  const connection = process.env.DATABASE_URL!;
  if (!connection) {
    throw new Error("DATABASE_URL is not set");
  }
  const db = drizzle({
    connection: process.env.DATABASE_URL!,
  });
  const url = new URL(connection);
  const schema = url.searchParams.get("schema") ?? "public";
  await db.execute(`drop schema ${schema} cascade`);
  await db.execute(`create schema ${schema}`);
  db.$client.end();
  console.log(`reset ${schema}`);
};

main();
