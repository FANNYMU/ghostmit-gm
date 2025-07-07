import { simpleGit } from "simple-git";
import { generateCommitMessage } from "./core/ai/index";
import * as path from "path";
import * as fs from "fs";
import { ensureAPIKey } from "./core/groq";
import { generateChangelog } from "./core/changelog_generator";
import { formatDiff, promptUser } from "./utils/helpers";

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

main();
