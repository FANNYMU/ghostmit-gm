import chalk from "chalk";

/**
 * Formats a git diff string into a more readable output by extracting file names and changes.
 *
 * @param diff - The raw git diff output string to be formatted
 * @returns An array of strings representing the formatted diff output, with:
 *          - File headers prefixed with '📄 File: '
 *          - Individual change lines (additions/removals)
 */
export function formatDiff(diff: string): string[] {
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
        output.push(
          `\n${chalk.blue.bold("📄 File:")} ${chalk.cyan(currentFile)}`,
        );
      }
    }
    // Handle change lines (additions/removals) while ignoring metadata lines
    else if (
      (line.startsWith("+") || line.startsWith("-")) &&
      !line.startsWith("+++") &&
      !line.startsWith("---")
    ) {
      // Color additions in green and deletions in red
      if (line.startsWith("+")) {
        output.push(chalk.green(line));
      } else if (line.startsWith("-")) {
        output.push(chalk.red(line));
      }
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
export function promptUser(question: string): Promise<string> {
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

/**
 * Displays a formatted summary of changes detected in the diff
 *
 * @param formattedDiff - Array of formatted diff lines
 */
export function displayChangeSummary(formattedDiff: string[]): void {
  const additions = formattedDiff.filter((line) => line.startsWith("+")).length;
  const deletions = formattedDiff.filter((line) => line.startsWith("-")).length;
  const files = formattedDiff.filter((line) =>
    line.includes("📄 File:"),
  ).length;

  console.log(chalk.gray("──────────────────────────────────"));
  console.log(chalk.blue.bold("📊 Change Summary:"));
  console.log(chalk.green(`  ✅ ${additions} additions`));
  console.log(chalk.red(`  ❌ ${deletions} deletions`));
  console.log(chalk.cyan(`  📁 ${files} files modified`));
  console.log(chalk.gray("──────────────────────────────────"));
}

/**
 * Displays a loading animation while processing
 *
 * @param message - Message to display during loading
 * @param duration - Duration in milliseconds (default: 1000)
 */
export function showLoading(
  message: string,
  duration: number = 1000,
): Promise<void> {
  return new Promise((resolve) => {
    const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
    let i = 0;

    const interval = setInterval(() => {
      process.stdout.write(
        `\r${chalk.blue(frames[i % frames.length])} ${chalk.gray(message)}`,
      );
      i++;
    }, 80);

    setTimeout(() => {
      clearInterval(interval);
      process.stdout.write(`\r${chalk.green("✅")} ${chalk.gray(message)}\n`);
      resolve();
    }, duration);
  });
}

/**
 * Displays an error message with consistent styling
 *
 * @param message - The error message to display
 * @param details - Optional error details
 */
export function displayError(message: string, details?: string): void {
  console.error(chalk.red.bold("❌ Error:"), chalk.red(message));
  if (details) {
    console.error(chalk.gray("Details:"), chalk.gray(details));
  }
}

/**
 * Displays a success message with consistent styling
 *
 * @param message - The success message to display
 */
export function displaySuccess(message: string): void {
  console.log(chalk.green.bold("✅"), chalk.green(message));
}

/**
 * Displays an info message with consistent styling
 *
 * @param message - The info message to display
 */
export function displayInfo(message: string): void {
  console.log(chalk.blue.bold("ℹ️"), chalk.blue(message));
}

/**
 * Displays a warning message with consistent styling
 *
 * @param message - The warning message to display
 */
export function displayWarning(message: string): void {
  console.log(chalk.yellow.bold("⚠️"), chalk.yellow(message));
}
