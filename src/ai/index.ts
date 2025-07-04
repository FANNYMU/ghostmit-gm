import { groq } from "../groq";

const systemPrompt = `You are an AI that generates commit messages. Please produce a detailed commit message in the format "feat: add bla bla bla" where the message clearly describes the changes introduced by the commit. Focus on the new features, fixes, or improvements made. Respond only with the commit message text itself, without any additional explanation or context.`;

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
