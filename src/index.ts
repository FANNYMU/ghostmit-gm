import { simpleGit } from "simple-git";
import { generateCommitMessage } from "./ai/index";
import * as path from "path";
import * as fs from "fs";
import { ensureAPIKey } from "./groq";

export let language = "english";
export let apiKey = "";

/**
 * This script automates the generation of commit messages for a git repository.
 * It uses AI to analyze the changes in the repository and produce a meaningful
 * commit message based on the diff and staged changes.
 */
async function main() {
  try {
    const args = process.argv.slice(2);
    const targetPath = args[0];
    const autoCommit = args[1] === "y";

    if (!targetPath) {
      console.log("Usage: gm <folder.git_path> [y/n]");
      return;
    }

    const resolvedPath = path.resolve(targetPath);
    const currentPath = targetPath === "." ? process.cwd() : resolvedPath;

    if (!fs.existsSync(path.join(currentPath, ".git"))) {
      console.error(`❌ Error: '${currentPath}' is not a git repository`);
      return;
    }

    apiKey = await ensureAPIKey();

    // Get preferred language
    language =
      (await promptUser(
        "Input your preferred language (default: english): ",
      )) || "english";

    const git = simpleGit({ baseDir: currentPath });
    const status = await git.status();

    if (!status) {
      console.error(`❌ Error: Could not get git status for '${currentPath}'`);
      return;
    }

    const diff = await git.diff();
    const stagedDiff = await git.diff(["--staged"]);
    const combinedDiff = diff + stagedDiff;

    const formattedDiff = formatDiff(combinedDiff);

    if (formattedDiff.length === 0) {
      console.log("ℹ️ No changes detected in the repository.");
      return;
    }

    const commitMessage = await generateCommitMessage(formattedDiff.join("\n"));
    console.log(`\n📝 Generated commit message:\n${commitMessage}\n`);

    const shouldCommit =
      autoCommit || (await promptUser("Commit changes? (y/n): ")) === "y";

    if (shouldCommit) {
      await git.add(".");
      await git.commit(commitMessage);
      console.log("✅ Changes committed successfully!");
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

function formatDiff(diff: string): string[] {
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

  return output;
}

function promptUser(question: string): Promise<string> {
  const rl = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer: string) => {
      rl.close();
      resolve(answer.toLowerCase().trim());
    });
  });
}

main();
