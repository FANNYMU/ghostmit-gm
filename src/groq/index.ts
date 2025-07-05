import Groq from "groq-sdk";
import * as readline from "readline";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const CONFIG_DIR = path.join(os.homedir(), ".ghostmit");
const ENV_FILE_PATH = path.join(CONFIG_DIR, "env.json");

let groqApiKey: string | null = null;
let apiKeyPromise: Promise<string> | null = null;

export async function ensureAPIKey(): Promise<string> {
  if (apiKeyPromise) {
    return apiKeyPromise;
  }

  try {
    if (fs.existsSync(ENV_FILE_PATH)) {
      const raw = fs.readFileSync(ENV_FILE_PATH, "utf-8");
      const json = JSON.parse(raw);

      if (json.GROQ_API_KEY && typeof json.GROQ_API_KEY === "string") {
        groqApiKey = json.GROQ_API_KEY;
        return json.GROQ_API_KEY;
      }
    }

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    apiKeyPromise = new Promise<string>((resolve) => {
      rl.question("Please enter your GROQ API key: ", (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    });

    const apiKey = await apiKeyPromise;
    groqApiKey = apiKey;

    if (!groqApiKey) {
      throw new Error("Failed to retrieve GROQ API key");
    }

    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }

    try {
      fs.writeFileSync(
        ENV_FILE_PATH,
        JSON.stringify({ GROQ_API_KEY: apiKey }, null, 2)
      );
      console.log(`✅ API key saved to ${ENV_FILE_PATH}`);
      return apiKey;
    } catch (err) {
      console.error("❌ Error saving API key:", err);
      throw new Error("Failed to save API key");
    }
  } catch (err) {
    console.error("❌ Error handling API key:", err);
    throw new Error("API key initialization failed");
  } finally {
    apiKeyPromise = null;
  }
}

export async function getGroqClient(): Promise<Groq> {
  try {
    const apiKey = await ensureAPIKey();
    return new Groq({ apiKey });
  } catch (error) {
    console.error("❌ Failed to create Groq client:", error);
    throw error;
  }
}
