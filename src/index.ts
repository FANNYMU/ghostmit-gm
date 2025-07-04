import { simpleGit } from "simple-git";
import { generateCommitMessage } from "./ai/index";
import * as path from "path";
import * as fs from "fs";

/**
 * This script automates the generation of commit messages for a git repository.
 * It uses AI to analyze the changes in the repository and produce a meaningful
 * commit message based on the diff and staged changes.
 */
async function main() {
  try {
    const args = process.argv.slice(2);
    const command = args[0];
    const targetPath = args[1];

    if (command == "gm" && targetPath) {
      const resolvedPath = path.resolve(targetPath);
      const currentPath = targetPath === "." ? process.cwd() : resolvedPath;

      if (!fs.existsSync(path.join(currentPath, ".git"))) {
        console.error(`❌ Error: '${currentPath}' is not a git repository`);
        return;
      }

      console.log("Generating commit message...");
      const git = simpleGit({ baseDir: currentPath });

      const status = await git.status();
      if (!status) {
        console.error(
          `❌ Error: Could not get git status for '${currentPath}'`,
        );
        return;
      }

      const diff = await git.diff();
      const stagedDiff = await git.diff(["--staged"]);

      const combinedDiff = diff + stagedDiff;
      const lines = combinedDiff.split("\n");
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

      if (output.length === 0) {
        console.log("No changes detected in the repository.");
        return;
      }

      console.log(await generateCommitMessage(output.join("\n")));
    } else {
      console.log("usage: gm <folder_.git_path>");
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

main();
