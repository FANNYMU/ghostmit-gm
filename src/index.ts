import { simpleGit } from "simple-git";
import { generateCommitMessage } from "./ai/index";

const git = simpleGit();

async function main() {
  try {
    const diff = await git.diff(); // full unified diff
    const lines = diff.split("\n");

    let currentFile = "";
    const output: string[] = [];

    for (const line of lines) {
      if (line.startsWith("diff --git")) {
        const match = line.match(/a\/(.+?)\s+b\/(.+)/);
        if (match) {
          currentFile = match[2];
          output.push(`\n📄 File: ${currentFile}`);
        }
      } else if (
        (line.startsWith("+") || line.startsWith("-")) &&
        !line.startsWith("+++") &&
        !line.startsWith("---")
      ) {
        output.push(line);
      }
    }

    console.log(await generateCommitMessage(output.join("\n")));
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

main();
