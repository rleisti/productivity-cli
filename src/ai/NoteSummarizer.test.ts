import NoteGatherer from "./NoteGatherer";
import PromptService from "./PromptService";
import NoteSummarize from "./NoteSummarizer";
import FakeAiService from "./FakeAiService";

describe("NoteSummarizer", () => {
  const aiService = new FakeAiService();
  const noteGatherer = new NoteGatherer({
    journalBasePath: "testResource/journal",
    clients: [],
  });
  const promptService = new PromptService({
    summarizeNotes: "./testResource/prompts/summarize-notes.txt",
  });
  const noteSummarizer = new NoteSummarize({
    aiService,
    noteGatherer,
    promptService,
  });

  describe("summarizeRange", () => {
    test("should accept an empty range", async () => {
      expect(await noteSummarizer.summarizeRange(0)).toBe(
        "No notes found for the specified period.",
      );
    });

    test("should send notes to the AI service with the correct prompt", async () => {
      const result = await noteSummarizer.summarizeRange(1, {
        year: 2020,
        month: 1,
        day: 1,
      });
      expect(result).toBe(`I see 1 messages.
**ROLE**:
user:

**MESSAGE**:
Summarize notes prompt:

<note-2019-12-31>
<Journal>
A sample journal file for Tuesday, Dec 31, 2019</Journal>


</note-2019-12-31>
<note-2020-01-01>
<Journal>
A sample journal file for Wednesday, January 1, 2020</Journal>


</note-2020-01-01>


End of prompt`);
    });
  });
});
