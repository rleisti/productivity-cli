import PromptService from "./PromptService";

describe("PromptService", () => {
  describe("getPrompt", () => {
    test("should return a default prompt when no prompt value is specified", async () => {
      const promptService = new PromptService({});
      expect(await promptService.getPrompt("summarizeNotes")).toBeTruthy();
    });

    test("should return a default prompt when no prompt value is blank", async () => {
      const promptService = new PromptService({ summarizeNotes: "" });
      expect(await promptService.getPrompt("summarizeNotes")).toBeTruthy();
    });

    test("should return prompt from a file when specified", async () => {
      const promptService = new PromptService({
        summarizeNotes: "testResource/prompts/summarize-notes.txt",
      });
      expect(await promptService.getPrompt("summarizeNotes")).toBe(
        "Summarize notes prompt:\n\n{notes}\n\nEnd of prompt",
      );
    });
  });
});
