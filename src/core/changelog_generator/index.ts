import { generateChangelogEntry } from "../ai";
import fs from "fs";

export function getVersion(): string {
  try {
    return fs.readFileSync("VERSION", "utf8").trim();
  } catch (error) {
    console.error("Error reading version file:", error);
    return "1.0.0";
  }
}

export async function generateChangelog(diff: string): Promise<void> {
  try {
    const entry = await generateChangelogEntry(diff);

    if (entry && entry.changelog) {
      fs.appendFileSync(
        "CHANGELOG.md",
        `\n\n${entry.changelog.replace(/\\n/g, "\n")}`,
      );
      fs.writeFileSync("VERSION", entry.version);
      console.log("✅ Changelog generated successfully!");
    } else {
      console.log("No changes detected");
    }
  } catch (error) {
    console.error("Error generating changelog:", error);
  }
}
