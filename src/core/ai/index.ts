import { getGroqClient } from "../groq";
import {
  AiChangelogSystemPrompt,
  AiCommitMessageSystemPrompt,
} from "./prompts";

interface ChangelogEntry {
  version: string;
  changelog: string;
}

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
