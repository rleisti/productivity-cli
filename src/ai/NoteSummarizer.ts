import NoteGatherer from "./NoteGatherer";
import { AiService, AiServiceMessage } from "./AiService";
import { Day } from "../journal/types";
import { zeroPad } from "../util";
import PromptService from "./PromptService";

type NoteSummarizerConfiguration = {
  aiService: AiService;
  noteGatherer: NoteGatherer;
  promptService: PromptService;
};

/**
 * A service for summarizes notes using an AI model
 */
export default class NoteSummarizer {
  private readonly config: NoteSummarizerConfiguration;

  constructor(config: NoteSummarizerConfiguration) {
    this.config = config;
  }

  /**
   * Summarize notes over a given number of days.
   *
   * @param numDays the number of days to summarize. (eg. last 7 days)
   * @param relativeTo the relative end date of the summarization. Defaults to today.
   */
  public async summarizeRange(
    numDays: number,
    relativeTo?: Day,
  ): Promise<string> {
    const relativeDate = relativeTo
      ? new Date(relativeTo.year, relativeTo.month - 1, relativeTo.day)
      : new Date();
    let noteContent = "";
    const currentDate = new Date(
      relativeDate.getFullYear(),
      relativeDate.getMonth(),
      relativeDate.getDate() - numDays,
    );
    while (currentDate <= relativeDate) {
      const day = {
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1,
        day: currentDate.getDate(),
      };
      const note = await this.config.noteGatherer.findNotes(day);
      if (note) {
        const noteTag = `note-${zeroPad(currentDate.getFullYear(), 4)}-${zeroPad(currentDate.getMonth() + 1, 2)}-${zeroPad(currentDate.getDate(), 2)}`;
        noteContent += `<${noteTag}>\n${note}\n</${noteTag}>\n`;
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (!noteContent) {
      return "No notes found for the specified period.";
    }

    const content = (
      await this.config.promptService.getPrompt("summarizeNotes")
    ).replace(/\{notes}/g, noteContent);

    const query: AiServiceMessage[] = [
      {
        role: "user",
        content,
      },
    ];
    const queryResponse = await this.config.aiService.converse(query);
    return queryResponse.content;
  }
}
