import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

const env = fs.readFileSync(".env.local", "utf8");
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);
const url = urlMatch[1].trim();
const anonKey = keyMatch[1].trim();

const supabase = createClient(url, anonKey);

const tables = [
  "profiles",
  "lesson_progress",
  "tasks",
  "attempts",
  "exam_results",
  "study_sessions",
  "watchlist",
];

console.log("Testing as fully UNAUTHENTICATED anon client (no session at all) against:", url.replace(/https:\/\/(.{6}).*/, "https://$1..."));
console.log("Expectation: every table should return 0 rows (RLS policies all require auth.uid() = user_id, and an unauthenticated request has auth.uid() = null)\n");

for (const table of tables) {
  const { data, error, count } = await supabase.from(table).select("*", { count: "exact" }).limit(5);
  if (error) {
    console.log(`${table}: ERROR — ${error.message} (code: ${error.code})`);
  } else {
    console.log(`${table}: ${data.length} rows returned, count=${count} — ${data.length === 0 ? "BLOCKED (expected)" : "!!! LEAKED DATA !!!"}`);
  }
}
