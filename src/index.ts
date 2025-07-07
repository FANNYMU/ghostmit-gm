import { simpleGit } from "simple-git";
import { generateCommitMessage } from "./core/ai/index";
import * as path from "path";
import * as fs from "fs";
import { ensureAPIKey } from "./core/groq";
import { generateChangelog } from "./core/changelog_generator";
import { formatDiff, promptUser } from "./utils/helpers";
import chalk from "chalk";

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
      console.log(
        chalk.blue.bold("Usage:"),
        chalk.cyan("gm <folder.git_path> [y/n] [y/n]"),
      );
      return;
    }

    // Resolve the absolute path of the provided directory
    const resolvedPath = path.resolve(targetPath);
    const currentPath = targetPath === "." ? process.cwd() : resolvedPath;

    // Ensure the provided directory contains a valid git repository
    if (!fs.existsSync(path.join(currentPath, ".git"))) {
      console.error(
        chalk.red.bold("❌ Error:"),
        chalk.red(`'${currentPath}' is not a git repository`),
      );
      return;
    }

    console.log(chalk.blue("🔍 Analyzing repository..."));

    // Retrieve API key for AI interaction
    apiKey = await ensureAPIKey();

    // Prompt the user for preferred language (default is English)
    language =
      (await promptUser(
        chalk.cyan("Input your preferred language (default: english): "),
      )) || "english";

    // Initialize git instance and retrieve repository status
    const git = simpleGit({ baseDir: currentPath });
    const status = await git.status();

    if (!status) {
      console.error(
        chalk.red.bold("❌ Error:"),
        chalk.red(`Could not get git status for '${currentPath}'`),
      );
      return;
    }

    // Display repository status
    console.log(chalk.gray("Repository status:"));
    if (status.modified.length > 0) {
      console.log(
        chalk.yellow("  Modified:"),
        chalk.yellow(status.modified.join(", ")),
      );
    }
    if (status.not_added.length > 0) {
      console.log(
        chalk.red("  Not added:"),
        chalk.red(status.not_added.join(", ")),
      );
    }
    if (status.staged.length > 0) {
      console.log(
        chalk.green("  Staged:"),
        chalk.green(status.staged.join(", ")),
      );
    }

    // Get both staged and unstaged diffs from the repository
    console.log(chalk.blue("📊 Generating diff..."));
    const diff = await git.diff();
    const stagedDiff = await git.diff(["--staged"]);
    const combinedDiff = diff + stagedDiff;

    // Format the diff for analysis by the AI
    const formattedDiff = formatDiff(combinedDiff);

    // If no changes are detected, exit gracefully
    if (formattedDiff.length === 0) {
      console.log(chalk.yellow("ℹ️ No changes detected in the repository."));
      return;
    }

    console.log(chalk.blue("🤖 Generating commit message with AI..."));

    // Generate a commit message using the formatted diff
    const commitMessage = await generateCommitMessage(formattedDiff.join("\n"));

    console.log(chalk.green.bold("\n📝 Generated commit message:"));
    console.log(chalk.white.bgBlue.bold(` ${commitMessage} `));
    console.log();

    // Determine if the user wants to proceed with committing the changes
    const shouldCommit =
      autoCommit ||
      (await promptUser(chalk.cyan("Commit changes? (y/n): "))) === "y";

    if (shouldCommit) {
      console.log(chalk.blue("🚀 Committing changes..."));
      // Stage all changes and perform the commit with the generated message
      await git.add(".");
      await git.commit(commitMessage);
      console.log(chalk.green.bold("✅ Changes committed successfully!"));
    } else {
      console.log(chalk.gray("⏭️ Skipping commit."));
    }

    const shouldChangelog =
      autoChangelog ||
      (await promptUser(chalk.cyan("Generate changelog? (y/n): "))) === "y";

    if (shouldChangelog) {
      console.log(chalk.blue("📋 Generating changelog..."));
      await generateChangelog(formattedDiff.join("\n"));
      console.log(chalk.green.bold("✅ Changelog generated successfully!"));
    } else {
      console.log(chalk.gray("⏭️ Skipping changelog generation."));
    }

    console.log(chalk.green.bold("\n🎉 All done!"));
  } catch (error) {
    console.error(
      chalk.red.bold("❌ Error:"),
      chalk.red(error instanceof Error ? error.message : String(error)),
    );
    process.exit(1);
  }
}

// Add some startup flair
console.log(chalk.blue.bold("🚀 Git Commit Message Generator"));
console.log(chalk.gray("──────────────────────────────────"));

main();
