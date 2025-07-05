import { groq } from "../groq";

const systemPrompt = `
You are an AI that generates conventional commit messages.
First, decide the proper <type> based on the change: feat, fix, docs, style, refactor, perf, test, or chore.
Then output exactly "<type>: <short description>".

Here are some examples:
# Example 1: new feature
diff --git a/foo.js b/foo.js
+ function newFeature() { /* … */ }
→ feat: add newFeature function to foo.js

# Example 2: bug fix
diff --git a/bar.js b/bar.js
- const x = 5;
+ const x = 10; // correct default value
→ fix: correct default value for x in bar.js

# Example 3: refactor
diff --git a/baz.js b/baz.js
- function doThing() { doA(); doB(); }
+ function doThing() { doB(); doA(); }
→ refactor: swap execution order of doA and doB in doThing

Now analyze the diff and respond **only** with the commit message.
`;

/**
 * This function generates a commit message based on the provided diff.
 * It uses a system prompt to instruct the AI on the format and content of the commit message.
 * The AI processes the diff and returns a detailed commit message describing the changes.
 */
export async function generateCommitMessage(diff: string): Promise<string> {
  const userPrompt = `
     this diff code

     ${diff}
   `;

  const result = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userPrompt,
      },
    ],
    model: "llama-3.3-70b-versatile",
  });

  return result.choices[0].message.content || "";
}

// export default { generateCommitMessage };
