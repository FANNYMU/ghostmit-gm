import { simpleGit } from "simple-git";
import { generateCommitMessage } from "./core/ai/index";
import * as path from "path";
import * as fs from "fs";
import { ensureAPIKey } from "./core/groq";
import { generateChangelog } from "./core/changelog_generator";

export let language = "english";
export let apiKey = "";

/**
 * Main function to automate git commit message generation.
 * This script uses AI to analyze repository changes and generate meaningful commit messages.
 *
 * @param {string[]} args - Command-line arguments passed to the script.
 *                         The first argument should be the target path of the git repository.
 *                         The second argument is optional and indicates whether to auto-commit ("y" or "n").
 */
async function main() {
  try {
    const args = process.argv.slice(2);

    // Extract command-line arguments
    const targetPath = args[0];
    const autoCommit = args[1] === "y";
    const autoChangelog = args[2] === "y";

    if (!targetPath) {
      console.log("Usage: gm <folder.git_path> [y/n] [y/n]");
      return;
    }

    // Resolve the absolute path of the provided directory
    const resolvedPath = path.resolve(targetPath);
    const currentPath = targetPath === "." ? process.cwd() : resolvedPath;

    // Ensure the provided directory contains a valid git repository
    if (!fs.existsSync(path.join(currentPath, ".git"))) {
      console.error(`❌ Error: '${currentPath}' is not a git repository`);
      return;
    }

    // Retrieve API key for AI interaction
    apiKey = await ensureAPIKey();

    // Prompt the user for preferred language (default is English)
    language =
      (await promptUser(
        "Input your preferred language (default: english): ",
      )) || "english";

    // Initialize git instance and retrieve repository status
    const git = simpleGit({ baseDir: currentPath });
    const status = await git.status();

    if (!status) {
      console.error(`❌ Error: Could not get git status for '${currentPath}'`);
      return;
    }

    // Get both staged and unstaged diffs from the repository
    const diff = await git.diff();
    const stagedDiff = await git.diff(["--staged"]);
    const combinedDiff = diff + stagedDiff;

    // Format the diff for analysis by the AI
    const formattedDiff = formatDiff(combinedDiff);

    // If no changes are detected, exit gracefully
    if (formattedDiff.length === 0) {
      console.log("ℹ️ No changes detected in the repository.");
      return;
    }

    // Generate a commit message using the formatted diff
    const commitMessage = await generateCommitMessage(formattedDiff.join("\n"));
    console.log(`\n📝 Generated commit message:\n${commitMessage}\n`);

    // Determine if the user wants to proceed with committing the changes
    const shouldCommit =
      autoCommit || (await promptUser("Commit changes? (y/n): ")) === "y";

    if (shouldCommit) {
      // Stage all changes and perform the commit with the generated message
      await git.add(".");
      await git.commit(commitMessage);
      console.log("✅ Changes committed successfully!");
    }
    const shouldChangelog =
      autoChangelog ||
      (await promptUser("Generate changelog? (y/n): ")) === "y";

    if (shouldChangelog) {
      await generateChangelog(formattedDiff.join("\n"));
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

/**
 * Formats a git diff string into a more readable output by extracting file names and changes.
 *
 * @param diff - The raw git diff output string to be formatted
 * @returns An array of strings representing the formatted diff output, with:
 *          - File headers prefixed with '📄 File: '
 *          - Individual change lines (additions/removals)
 */
function formatDiff(diff: string): string[] {
  const lines = diff.split("\n");
  let currentFile = "";
  const output: string[] = [];

  // Process each line of the diff
  for (const line of lines) {
    // Handle file header lines (start with 'diff --git')
    if (line.startsWith("diff --git")) {
      const match = line.match(/a\/(.+?)\s+b\/(.+)/);
      if (match) {
        currentFile = match[2];
        output.push(`\n📄 File: ${currentFile}`);
      }
    }
    // Handle change lines (additions/removals) while ignoring metadata lines
    else if (
      (line.startsWith("+") || line.startsWith("-")) &&
      !line.startsWith("+++") &&
      !line.startsWith("---")
    ) {
      output.push(line);
    }
  }

  return output;
}

/**
 * Prompts the user with a question and returns the processed answer.
 *
 * This function uses Node.js's `readline` module to create an interface
 * for reading input from the standard input (stdin) and writing output
 * to the standard output (stdout). It asks the provided question to the user,
 * processes the response by trimming whitespace and converting it to lowercase,
 * and then closes the readline interface.
 *
 * @param question - The question to display to the user. This will be shown as a prompt.
 * @returns A Promise that resolves with the user's answer, trimmed and converted to lowercase.
 */
function promptUser(question: string): Promise<string> {
  // Creates a readline interface for handling user input/output.
  const rl = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    // Asks the user the given question and handles their response.
    rl.question(question, (answer: string) => {
      rl.close();
      resolve(answer.toLowerCase().trim());
    });
  });
}

main();
