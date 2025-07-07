import { generateChangelogEntry } from "../ai";
import fs from "fs";
import chalk from "chalk";
import {
  displayError,
  displaySuccess,
  displayInfo,
  displayWarning,
  showLoading,
} from "../../utils/helpers";

/**
 * Reads the current version from VERSION file
 * @returns The current version string or default "1.0.0"
 */
export function getVersion(): string {
  try {
    const version = fs.readFileSync("VERSION", "utf8").trim();
    console.log(chalk.blue("📋 Current version:"), chalk.cyan(version));
    return version;
  } catch (error) {
    displayWarning("Version file not found, using default version 1.0.0");
    return "1.0.0";
  }
}

/**
 * Generates and appends a changelog entry based on the provided diff
 * @param diff - The git diff string to analyze
 */
export async function generateChangelog(diff: string): Promise<void> {
  try {
    // Show loading animation while generating changelog
    await showLoading("Analyzing changes for changelog...", 1500);

    displayInfo("Generating changelog entry with AI...");

    const entry = await generateChangelogEntry(diff);

    if (entry && entry.changelog) {
      // Display the generated changelog entry
      console.log(chalk.green.bold("\n📝 Generated changelog entry:"));
      console.log(chalk.white.bgGreen.bold(" CHANGELOG PREVIEW "));
      console.log(chalk.gray("──────────────────────────────────"));
      console.log(chalk.white(entry.changelog.replace(/\\n/g, "\n")));
      console.log(chalk.gray("──────────────────────────────────"));

      // Check if CHANGELOG.md exists, if not create it with header
      if (!fs.existsSync("CHANGELOG.md")) {
        displayInfo("Creating new CHANGELOG.md file...");
        const header = `# Changelog\n\nAll notable changes to this project will be documented in this file.\n\nThe format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),\nand this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).\n`;
        fs.writeFileSync("CHANGELOG.md", header);
      }

      // Append the new changelog entry
      fs.appendFileSync(
        "CHANGELOG.md",
        `\n\n${entry.changelog.replace(/\\n/g, "\n")}`,
      );

      // Update version file
      const oldVersion = getVersion();
      fs.writeFileSync("VERSION", entry.version);

      displaySuccess("Changelog generated successfully!");
      console.log(
        chalk.blue("📈 Version updated:"),
        `${chalk.gray(oldVersion)} → ${chalk.green.bold(entry.version)}`,
      );
      console.log(
        chalk.blue("📄 Files updated:"),
        chalk.cyan("CHANGELOG.md, VERSION"),
      );
    } else {
      displayWarning("No significant changes detected for changelog");
    }
  } catch (error) {
    displayError(
      "Failed to generate changelog",
      error instanceof Error ? error.message : String(error),
    );
    throw error;
  }
}

/**
 * Displays the current changelog content
 */
export function displayChangelog(): void {
  try {
    if (fs.existsSync("CHANGELOG.md")) {
      const changelog = fs.readFileSync("CHANGELOG.md", "utf8");
      console.log(chalk.blue.bold("\n📋 Current Changelog:"));
      console.log(chalk.gray("──────────────────────────────────"));
      console.log(changelog);
      console.log(chalk.gray("──────────────────────────────────"));
    } else {
      displayInfo("No changelog file found");
    }
  } catch (error) {
    displayError(
      "Failed to read changelog",
      error instanceof Error ? error.message : String(error),
    );
  }
}

/**
 * Validates the changelog format and structure
 */
export function validateChangelog(): boolean {
  try {
    if (!fs.existsSync("CHANGELOG.md")) {
      displayWarning("Changelog file does not exist");
      return false;
    }

    const changelog = fs.readFileSync("CHANGELOG.md", "utf8");

    // Basic validation checks
    const hasHeader = changelog.includes("# Changelog");
    const hasVersions = /## \[?\d+\.\d+\.\d+\]?/.test(changelog);

    if (hasHeader && hasVersions) {
      displaySuccess("Changelog format is valid");
      return true;
    } else {
      displayWarning("Changelog format may be invalid");
      if (!hasHeader) console.log(chalk.yellow("  - Missing changelog header"));
      if (!hasVersions)
        console.log(chalk.yellow("  - No version entries found"));
      return false;
    }
  } catch (error) {
    displayError(
      "Failed to validate changelog",
      error instanceof Error ? error.message : String(error),
    );
    return false;
  }
}

/**
 * Creates a backup of the current changelog
 */
export function backupChangelog(): void {
  try {
    if (fs.existsSync("CHANGELOG.md")) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupName = `CHANGELOG.backup.${timestamp}.md`;
      fs.copyFileSync("CHANGELOG.md", backupName);
      displaySuccess(`Changelog backed up to ${backupName}`);
    } else {
      displayWarning("No changelog file to backup");
    }
  } catch (error) {
    displayError(
      "Failed to backup changelog",
      error instanceof Error ? error.message : String(error),
    );
  }
}
