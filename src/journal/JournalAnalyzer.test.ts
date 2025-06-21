import JournalAnalyzer from "./JournalAnalyzer";

describe("JournalAnalyzer", () => {
  const basePath = "./testResource/journal";
  const analyzer = new JournalAnalyzer({ basePath });

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
              project: "Wednesday",
              activities: [
                {
                  activity: "task",
                  minutes: 60,
                  notes: [""],
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
          minutes: 300,
          minuteIncrements: [60, 60, 60, 60, 60],
          projects: [
            {
              project: "Wednesday",
              minutes: 60,
              minuteIncrements: [60],
            },
            {
              project: "Thursday",
              minutes: 60,
              minuteIncrements: [60],
            },
            {
              project: "Friday",
              minutes: 60,
              minuteIncrements: [60],
            },
            {
              project: "Saturday",
              minutes: 60,
              minuteIncrements: [60],
            },
            {
              project: "Sunday",
              minutes: 60,
              minuteIncrements: [60],
            },
          ],
        },
      ]);
    });
  });

  describe("analyzeWeek", () => {
    const relativeDay = { year: 2020, month: 1, day: 1 };

    test("should accept a week with no entries", async () => {
      const aggregation = await analyzer.analyzeWeek(-1, relativeDay);
      expect(aggregation).toStrictEqual([]);
    });

    test("should accept a week with entries", async () => {
      const aggregation = await analyzer.analyzeWeek(0, relativeDay);
      expect(aggregation).toStrictEqual(aggregationForFirstWeekOf2020);
    });

    test("should determine the week relative to a given day", async () => {
      const aggregation = await analyzer.analyzeWeek(-1, {
        year: 2020,
        month: 1,
        day: 7,
      });
      expect(aggregation).toStrictEqual(aggregationForFirstWeekOf2020);
    });

    test("should determine the beginning of week based on provided configuration", async () => {
      const analyzer = new JournalAnalyzer({ basePath, startOfWeek: 0 });
      const aggregation = await analyzer.analyzeWeek(0, relativeDay);
      expect(aggregation).toStrictEqual([
        {
          client: "ClientA",
          minutes: 360,
          minuteIncrements: [60, 60, 60, 60, 60, 60],
          projects: [
            {
              project: "Monday",
              minutes: 60,
              minuteIncrements: [60],
            },
            {
              project: "Tuesday",
              minutes: 60,
              minuteIncrements: [60],
            },
            {
              project: "Wednesday",
              minutes: 60,
              minuteIncrements: [60],
            },
            {
              project: "Thursday",
              minutes: 60,
              minuteIncrements: [60],
            },
            {
              project: "Friday",
              minutes: 60,
              minuteIncrements: [60],
            },
            {
              project: "Saturday",
              minutes: 60,
              minuteIncrements: [60],
            },
          ],
        },
      ]);
    });
  });

  const aggregationForFirstWeekOf2020 = [
    {
      client: "ClientA",
      minutes: 300,
      minuteIncrements: [60, 60, 60, 60, 60],
      projects: [
        {
          project: "Monday",
          minutes: 60,
          minuteIncrements: [60],
        },
        {
          project: "Tuesday",
          minutes: 60,
          minuteIncrements: [60],
        },
        {
          project: "Wednesday",
          minutes: 60,
          minuteIncrements: [60],
        },
        {
          project: "Thursday",
          minutes: 60,
          minuteIncrements: [60],
        },
        {
          project: "Friday",
          minutes: 60,
          minuteIncrements: [60],
        },
      ],
    },
  ];
});
