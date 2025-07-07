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
