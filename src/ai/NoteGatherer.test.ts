import NoteGatherer from "./NoteGatherer";

describe("NoteGatherer", () => {
  const noteGatherer = new NoteGatherer({
    journalBasePath: "testResource/journal",
    clients: [
      {
        client: "ClientA",
        notesFilePattern:
          "testResource/notes/ClientA/{year}/{year}-{month}-{day}.txt",
      },
    ],
  });

  describe("findNotes", () => {
    test("should return undefined when no notes exist", async () => {
      const notes = await noteGatherer.findNotes({
        year: 2018,
        month: 1,
        day: 1,
      });
      expect(notes).toBeUndefined();
    });

    test("should return journal notes when they exist", async () => {
      const notes = await noteGatherer.findNotes({
        year: 2019,
        month: 12,
        day: 30,
      });
      expect(notes).toBe(
        "<Journal>\n" +
          "A sample journal file for Monday, Dec 30, 2019</Journal>\n\n",
      );
    });

    test("should return client notes when they exist", async () => {
      const notes = await noteGatherer.findNotes({
        year: 2020,
        month: 3,
        day: 1,
      });
      expect(notes).toBe(
        "<ClientA>\n" + "Client notes for March 1, 2020</ClientA>\n\n",
      );
    });

    test("should return both journal and client notes when they exist", async () => {
      const notes = await noteGatherer.findNotes({
        year: 2020,
        month: 1,
        day: 1,
      });
      expect(notes).toBe(
        "<Journal>\n" +
          "A sample journal file for Wednesday, January 1, 2020</Journal>\n\n" +
          "<ClientA>\n" +
          "Client notes for January 1, 2020</ClientA>\n\n",
      );
    });

    test("should filter secret content out of client notes", async () => {
      const notes = await noteGatherer.findNotes({
        year: 2020,
        month: 4,
        day: 1,
      });
      expect(notes).toBe(
        "<ClientA>\nThis is a client note.\n\n\n\nContent in the middle of the note.\n\n\n\nThis is the rest of the note.</ClientA>\n\n",
      );
    });
  });
});
