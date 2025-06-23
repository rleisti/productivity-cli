import JournalDayRange from "./JournalDayRange";
import JournalDay from "./JournalDay";

describe("JournalDayRange", () => {
  describe("aggregate", () => {
    test("should accept an empty range", () => {
      const dayRange = new JournalDayRange([]);
      const aggregate = dayRange.aggregate();
      expect(aggregate).toEqual([]);
    });

    test("should accept a single day", () => {
      const dayRange = new JournalDayRange([
        JournalDay.read(
          "2020-01-01",
          `
        08:00 ClientA:ProjectA:TaskA
        08:30 break
        `,
        ),
      ]);
      const aggregate = dayRange.aggregate();
      expect(aggregate).toEqual([
        {
          client: "ClientA",
          minutes: 30,
          minuteIncrements: [30],
          projects: [
            {
              project: "ProjectA",
              minutes: 30,
              minuteIncrements: [30],
            },
          ],
        },
      ]);
    });

    test("should accept multiple days", () => {
      const dayRange = new JournalDayRange([
        JournalDay.read(
          "2020-01-01",
          `
          08:00 ClientA:ProjectA:TaskA
          08:30 ClientB:ProjectA:TaskA
          09:00 ClientA:ProjectA:TaskA
          09:30 break
          `,
        ),
        JournalDay.read(
          "2020-01-02",
          `
          08:00 ClientA:ProjectA:TaskA
          08:10 ClientB:ProjectA:TaskA
          08:20 ClientA:ProjectB:TaskA
          08:30 break
          `,
        ),
      ]);
      const aggregate = dayRange.aggregate();
      expect(aggregate).toEqual([
        {
          client: "ClientA",
          minutes: 80,
          minuteIncrements: [60, 10, 10],
          projects: [
            {
              project: "ProjectA",
              minutes: 70,
              minuteIncrements: [60, 10],
            },
            {
              project: "ProjectB",
              minutes: 10,
              minuteIncrements: [10],
            },
          ],
        },
        {
          client: "ClientB",
          minutes: 40,
          minuteIncrements: [30, 10],
          projects: [
            {
              project: "ProjectA",
              minutes: 40,
              minuteIncrements: [30, 10],
            },
          ],
        },
      ]);
    });
  });
});
