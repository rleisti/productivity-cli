import JournalAnalyzer from "./JournalAnalyzer";

describe("JournalAnalyzer", () => {
  const analyzer = new JournalAnalyzer({ basePath: "./testResource/journal" });

  describe("analyzeDay", () => {
    test("should accept a non-existent day", async () => {
      const journalDay = await analyzer.analyzeDay({
        year: 1950,
        month: 1,
        day: 1,
      });
      expect(journalDay.getDate()).toBe("1950-01-01");
      expect(journalDay.getClients()).toStrictEqual([]);
    });

    test("should accept an existing day", async () => {
      const journalDay = await analyzer.analyzeDay({
        year: 2020,
        month: 1,
        day: 1,
      });
      expect(journalDay.getDate()).toBe("2020-01-01");
      expect(journalDay.getClients()).toStrictEqual([
        {
          client: "ClientA",
          projects: [
            {
              project: "ProjectA",
              activities: [
                {
                  activity: "busy",
                  minutes: 30,
                  notes: ["Did some busy work"],
                },
              ],
            },
          ],
        },
      ]);
    });
  });

  describe("analyzeMonth", () => {
    test("should accept a month with no entries", async () => {
      const aggregation = await analyzer.analyzeMonth({ year: 2019, month: 1 });
      expect(aggregation).toStrictEqual([]);
    });

    test("should process a month with entries", async () => {
      const aggregation = await analyzer.analyzeMonth({ year: 2020, month: 1 });
      expect(aggregation).toStrictEqual([
        {
          client: "ClientA",
          minutes: 90,
          minuteIncrements: [30, 30, 30],
          projects: [
            {
              project: "ProjectA",
              minutes: 60,
              minuteIncrements: [30, 30],
            },
            {
              project: "ProjectB",
              minutes: 30,
              minuteIncrements: [30],
            },
          ],
        },
        {
          client: "ClientB",
          minutes: 30,
          minuteIncrements: [30],
          projects: [
            {
              project: "ProjectC",
              minutes: 30,
              minuteIncrements: [30],
            },
          ],
        },
      ]);
    });
  });
});
