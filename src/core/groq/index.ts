import Groq from "groq-sdk";
import * as readline from "readline";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const CONFIG_DIR = path.join(os.homedir(), ".ghostmit");
const ENV_FILE_PATH = path.join(CONFIG_DIR, "env.json");

let groqApiKey: string | null = null;
let apiKeyPromise: Promise<string> | null = null;

/**
 * Ensures the GROQ API key is obtained and saved
 * Returns the existing promise if one is already in progress
 * @returns A promise that resolves with the API key
 */
export async function ensureAPIKey(): Promise<string> {
  if (apiKeyPromise) {
    return apiKeyPromise;
  }

  try {
    // Attempt to read the API key from the local file
    if (fs.existsSync(ENV_FILE_PATH)) {
      const raw = fs.readFileSync(ENV_FILE_PATH, "utf-8");
      const json = JSON.parse(raw);

      if (json.GROQ_API_KEY && typeof json.GROQ_API_KEY === "string") {
        groqApiKey = json.GROQ_API_KEY;
        return json.GROQ_API_KEY;
      }
    }

    // Create command line interface to get user input
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    // Create promise to wait for user input API key
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

    // If the configuration directory does not exist, create it
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }

    try {
      // Write API key to local file
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

/**
 * Creates and returns a Groq client instance with the configured API key.
 * 
 * This function:
 * - Ensures the API key is available by calling `ensureAPIKey()`
 * - Initializes a new Groq client instance with the obtained API key
 * - Handles potential errors during client creation
 * 
 * @returns {Promise<Groq>} A promise that resolves to a configured Groq client instance
 * @throws {Error} If the API key cannot be obtained or client creation fails
 */
export async function getGroqClient(): Promise<Groq> {
  try {
    const apiKey = await ensureAPIKey();
    return new Groq({ apiKey });
  } catch (error) {
    console.error("❌ Failed to create Groq client:", error);
    throw error;
  }
}
