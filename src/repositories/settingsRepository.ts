import { query } from "../db/pool";

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const result = await query<{ value: T }>("select value from app_settings where key = $1", [key]);
  return result.rows[0]?.value ?? fallback;
}

export async function getAgeSettings(): Promise<{ minAge: number; maxAge: number }> {
  const [minAge, maxAge] = await Promise.all([
    getSetting<number>("min_age", 18),
    getSetting<number>("max_age", 100)
  ]);
  return { minAge, maxAge };
}

