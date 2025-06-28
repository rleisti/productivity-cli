import fs from "fs";
import { Prompts } from "../Config";

export type PromptName = "summarizeNotes";

/**
 * A service for retrieving prompts by name
 */
export default class PromptService {
  private readonly prompts: Prompts;

  constructor(prompts: Prompts) {
    this.prompts = prompts;
  }

  /**
   * Retrieve the content of a given prompt
   *
   * @param name the prompt to return.
   */
  public async getPrompt(name: PromptName): Promise<string> {
    switch (name) {
      case "summarizeNotes": {
        return (this.prompts.summarizeNotes ?? "") !== ""
          ? this.getPromptFromFile(this.prompts.summarizeNotes!)
          : this.getDefaultPrompt(name);
      }
    }
  }

  private async getPromptFromFile(path: string): Promise<string> {
    return new Promise((resolve, reject) => {
      fs.readFile(path, "utf8", (error, data) => {
        if (error) {
          reject(error);
        }

        resolve(data);
      });
    });
  }

  private getDefaultPrompt(name: PromptName): string {
    switch (name) {
      case "summarizeNotes": {
        return `Summarize the following notes. The summary should highlight the most important points and provide a list of recommended actions.\n{notes}`;
      }
    }
  }
}
