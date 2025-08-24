import { ClientNotesService } from "./ClientNotesService";

describe("ClientNotesService", () => {
  describe("getDailyNotesPath", () => {
    test("should support a static path", () => {
      const service = new ClientNotesService({
        client: "client",
        notesFilePattern: "notes/note.txt",
      });
      expect(service.getDailyNotesPath({ year: 2021, month: 1, day: 1 })).toBe(
        "notes/note.txt",
      );
    });

    test("should support all substitutions", () => {
      const service = new ClientNotesService({
        client: "client",
        notesFilePattern: "notes/{year}-{month}-{day}-note.txt",
      });
      expect(service.getDailyNotesPath({ year: 2021, month: 1, day: 1 })).toBe(
        "notes/2021-01-01-note.txt",
      );
    });
  });
});
