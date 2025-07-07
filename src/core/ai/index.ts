import { language } from "../..";
import { getVersion } from "../changelog_generator";
import { getGroqClient } from "../groq";

interface ChangelogEntry {
  version: string;
  changelog: string;
}

const AiCommitMessageSystemPrompt = `
You are an expert AI commit message generator that follows Conventional Commits specification.
Your task is to analyze code changes and generate professional commit messages.

## Output Rules
1. Strict format: "<type>: <description>"
2. Type must be one of:
   • feat     - New feature
   • fix      - Bug fix
   • docs     - Documentation changes
   • style    - Formatting, whitespace
   • refactor - Code restructuring
   • perf     - Performance improvement
   • test     - Test additions/modifications
   • chore    - Maintenance tasks
   • build    - Build system changes
   • ci       - CI configuration changes
   • revert   - Reverts previous commit
3. Description: 50-72 characters, ${language} language only
4. Description must:
   - Summarize ALL changes concisely
   - Include key file names when relevant
   - NEVER mention diff markers (+/-) or code syntax
   - Focus on the "why" not just "what"


## Critical Instructions
- Analyze the actual code changes, not diff formatting
- Respond ONLY with the commit message
- Use ${language} language exclusively
- Never add explanations or additional text
`;

const AiChangelogSystemPrompt = `
 You are an expert AI changelog generator that follows Conventional Commits specification.
 Your task is to analyze code changes and generate professional changelog entries.
 Always return in json.


## Instructions
- Analyze the following code changes and generate a changelog entry:
- Respond ONLY with the changelog entry
- Use ${language} language exclusively
- Never add explanations or additional text
- Here's the previous version: ${getVersion()}
- if one of these does not exist please do not generate just leave it empty and also in the changelog object do not generate any more objects or arrays in it just text ✨ Added,🐛 Fixed,📦 Changed,🧹 Removed

## Examples
   this inside the CHANGLOG
   "
   {
    version: ${getVersion()},
    changelog: {


    ## [1.0.0] - 2025-07-07

    ### ✨ Added
    - JSON template-based project structure generator feature
    - CLI command ‘debox clean’ to remove common junk files (‘node_modules’, ‘.log’, ‘dist’, etc)
    - New option ‘--silent’ on all CLI commands

    ### 🐛 Fixed
    - Fixed error when file is not found in 'debox format'
    - Fix absolute path bug in Windows

    ### 📦 Changed
    - Improved CLI performance when running 'debox list'
    - Output structure reformatted to be more concise

    ### 🧹 Removed
    - Node.js v12 support (minimum now v16)

    }
   }
   "
`;

const groqPromise = getGroqClient();

/**
 * Generates a commit message based on code diff analysis.
 * Uses AI to create a structured commit message following Conventional Commits specification.
 *
 * @param diff - The git diff string containing code changes
 * @returns A professionally formatted commit message
 */
export async function generateCommitMessage(diff: string): Promise<string> {
  const userPrompt = `
    Analyze the following code changes and generate a commit message:
    ${diff}
  `;

  const groqClient = await groqPromise;
  const result = await groqClient.chat.completions.create({
    messages: [
      { role: "system", content: AiCommitMessageSystemPrompt },
      { role: "user", content: userPrompt },
    ],
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
    max_tokens: 150,
  });

  return result.choices[0].message.content?.trim() || "";
}

export async function generateChangelogEntry(
  diff: string,
): Promise<ChangelogEntry> {
  const currentDate = new Date();
  const userPrompt = `
    Current Date: ${currentDate.toISOString()}
    Analyze the following code changes and generate a changelog entry:
    ${diff}
  `.trim();

  const groqClient = await groqPromise;
  const result = await groqClient.chat.completions.create({
    messages: [
      { role: "system", content: AiChangelogSystemPrompt },
      { role: "user", content: userPrompt },
    ],
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
    max_tokens: 500,
  });

  const response = result.choices[0].message.content?.trim();
  if (!response) {
    throw new Error("AI response is empty!");
  }

  return JSON.parse(response);
}
