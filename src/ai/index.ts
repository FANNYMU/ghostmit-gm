import { language } from "..";
import { getGroqClient } from "../groq";

const systemPrompt = `
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
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
    max_tokens: 150
  });

  return result.choices[0].message.content?.trim() || "";
}

// export default { generateCommitMessage };
