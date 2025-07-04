import Groq from "groq-sdk";
import { config } from "dotenv";
import * as readline from "readline";
import { exec } from "child_process";
import * as os from "os";

config();

if (!process.env.GROQ_API_KEY) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question("Please enter your GROQ API key: ", (apiKey) => {
    const platform = os.platform();

    if (platform === "linux") {
      // For Linux
      exec(
        `echo "export GROQ_API_KEY=${apiKey}" >> ~/.bashrc && source ~/.bashrc`,
        (error) => {
          if (error) {
            console.error("Error saving API key:", error);
            process.exit(1);
          }
        },
      );
    } else if (platform === "darwin") {
      exec(
        `echo "export GROQ_API_KEY=${apiKey}" >> ~/.zshrc && source ~/.zshrc`,
        (error) => {
          if (error) {
            console.error("Error saving API key:", error);
            process.exit(1);
          }
        },
      );
    } else if (platform === "win32") {
      exec(`setx GROQ_API_KEY ${apiKey}`, (error) => {
        if (error) {
          console.error("Error saving API key:", error);
          process.exit(1);
        }
      });
    }

    rl.close();
  });
}

export const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
