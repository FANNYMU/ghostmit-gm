import { generateChangelogEntry } from "../ai";
import fs from "fs";

export function getVersion(): string {
  try {
    const version = fs.readFileSync("VERSION");
    return version.toString();
  } catch (error) {
    return "1.0.0";
  }
}

export async function generateChangelog(diff: string) {
  const entry = await generateChangelogEntry(diff);
  const version = entry.version;

  fs.appendFileSync("CHANGELOG.md", `\n\n${entry.changelog}`);
  fs.writeFileSync("VERSION", version);
  console.log("✅ Changelog generated successfully!");
}
