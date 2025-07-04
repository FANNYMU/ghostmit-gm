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
    const targetPath = args[0];

    if (targetPath) {
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

      const commitMessage = await generateCommitMessage(output.join("\n"));
      console.log(commitMessage);

      const shouldCommit = await new Promise<string>((resolve) => {
        const rl = require("readline").createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        rl.question("commit: y/n ", (answer: string) => {
          rl.close();
          resolve(answer.toLowerCase());
        });
      });

      if (shouldCommit === "y") {
        await git.add(".");
        await git.commit(commitMessage);
        console.log("✅ Changes committed successfully!");
      }
    } else {
      console.log("usage: gm <folder_.git_path> [y/n]");
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

main();
