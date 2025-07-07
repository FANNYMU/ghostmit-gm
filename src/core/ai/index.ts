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
You are an expert AI changelog generator that strictly follows the Conventional Commits specification.

Your task is to analyze code changes and generate a professional changelog **in valid JSON format**.

---

🎯 Instructions:
- Respond ONLY with valid JSON.
- The JSON must have two fields:
  - "version": a string, e.g., "1.1.2"
  - "changelog": a string containing the changelog in Markdown format, using headers like "##", "### ✨ Added", etc.
- DO NOT wrap the markdown as an object — it must be plain string value.
- If a section (Added, Fixed, Changed, Removed) has no content, include the heading anyway, but leave it empty.
- DO NOT add explanations, metadata, or anything outside the JSON object.
- DO NOT include comments, examples, or markdown outside the 'changelog' string.
- Use the "${language}" language (e.g., English or Indonesian).
- Here's the previous version: ${getVersion()}

---

✅ Example (for reference):


{
  "version": "1.1.2",
  "changelog": "## [1.1.2] - 2025-07-07\\n### ✨ Added\\n- Added auto formatter\\n### 🐛 Fixed\\n- Fixed crash on empty input\\n### 📦 Changed\\n- Improved changelog formatting\\n### 🧹 Removed\\n"
}

Alwasy response in json like that
Respond now.
`.trim();

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
  const now = new Date();
  const userPrompt = `
    Now: ${now.toISOString()}
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
  if (!response) throw new Error("AI response is empty!");

  return JSON.parse(response);
}
