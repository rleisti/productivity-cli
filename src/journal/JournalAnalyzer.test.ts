import JournalAnalyzer from "./JournalAnalyzer";
import { Day, JournalClientConfiguration } from "./types";

describe("JournalAnalyzer", () => {
  const basePath = "./testResource/journal";
  const workDayClassifier = (day: Day) => {
    const date = new Date(day.year, day.month - 1, day.day);
    return date.getDay() !== 0 && date.getDay() !== 6;
  };
  const clients: JournalClientConfiguration[] = [];
  const analyzer = new JournalAnalyzer({
    basePath,
    workDayClassifier,
    clients,
  });

  describe("analyzeDay", () => {
    test("should accept a non-existent day", async () => {
      expect(
        await analyzer.analyzeDay({
          year: 1950,
          month: 1,
          day: 1,
        }),
      ).toStrictEqual({
        date: "1950-01-01",
        totalMinutes: 0,
        clients: [],
      });
    });

    test("should accept an existing day", async () => {
      expect(
        await analyzer.analyzeDay({
          year: 2020,
          month: 1,
          day: 1,
        }),
      ).toStrictEqual({
        date: "2020-01-01",
        totalMinutes: 60,
        clients: [
          {
            client: "ClientA",
            minutes: 60,
            roundedMinutes: 60,
            projects: [
              {
                project: "Wednesday",
                minutes: 60,
                roundedMinutes: 60,
                activities: [
                  {
                    activity: "task",
                    minutes: 60,
                    roundedMinutes: 60,
                    notes: [""],
                  },
                ],
              },
            ],
          },
        ],
      });
    });
  });

  describe("analyzeMonth", () => {
    test("should accept a month with no entries", async () => {
      const aggregation = await analyzer.analyzeMonth({ year: 2019, month: 1 });
      expect(aggregation).toStrictEqual({
        range: "2019-01",
        clients: [],
      });
    });

    test("should process a month with entries", async () => {
      const aggregation = await analyzer.analyzeMonth({ year: 2020, month: 1 });
      expect(aggregation).toStrictEqual({
        range: "2020-01",
        clients: [
          {
            client: "ClientA",
            actualMinutes: 300,
            roundedMinutes: 300,
            targetMinutes: 11040,
            periodTargetMinutes: 11040,
            projects: [
              {
                project: "Wednesday",
                actualMinutes: 60,
                roundedMinutes: 60,
              },
              {
                project: "Thursday",
                actualMinutes: 60,
                roundedMinutes: 60,
              },
              {
                project: "Friday",
                actualMinutes: 60,
                roundedMinutes: 60,
              },
              {
                project: "Saturday",
                actualMinutes: 60,
                roundedMinutes: 60,
              },
              {
                project: "Sunday",
                actualMinutes: 60,
                roundedMinutes: 60,
              },
            ],
          },
        ],
      });
    });
  });

  describe("analyzeWeek", () => {
    test("should accept a week with no entries", async () => {
      const aggregation = await analyzer.analyzeWeek(-1, {
        year: 2020,
        month: 1,
        day: 1,
      });
      expect(aggregation).toStrictEqual({
        range: "2019-12-21 to 2019-12-27",
        clients: [],
      });
    });

    test("should accept a week with entries", async () => {
      const aggregation = await analyzer.analyzeWeek(0, {
        year: 2020,
        month: 1,
        day: 1,
      });
      expect(aggregation).toStrictEqual({
        range: "2019-12-28 to 2020-01-03",
        clients: [
          {
            client: "ClientA",
            actualMinutes: 300,
            roundedMinutes: 300,
            targetMinutes: 1440,
            periodTargetMinutes: 2400,
            projects: [
              {
                project: "Monday",
                actualMinutes: 60,
                roundedMinutes: 60,
              },
              {
                project: "Tuesday",
                actualMinutes: 60,
                roundedMinutes: 60,
              },
              {
                project: "Wednesday",
                actualMinutes: 60,
                roundedMinutes: 60,
              },
              {
                project: "Thursday",
                actualMinutes: 60,
                roundedMinutes: 60,
              },
              {
                project: "Friday",
                actualMinutes: 60,
                roundedMinutes: 60,
              },
            ],
          },
        ],
      });
    });

    test("should determine the week relative to a given day", async () => {
      const aggregation = await analyzer.analyzeWeek(-1, {
        year: 2020,
        month: 1,
        day: 7,
      });
      expect(aggregation).toStrictEqual({
        range: "2019-12-28 to 2020-01-03",
        clients: [
          {
            client: "ClientA",
            actualMinutes: 300,
            roundedMinutes: 300,
            targetMinutes: 2400,
            periodTargetMinutes: 2400,
            projects: [
              {
                project: "Monday",
                actualMinutes: 60,
                roundedMinutes: 60,
              },
              {
                project: "Tuesday",
                actualMinutes: 60,
                roundedMinutes: 60,
              },
              {
                project: "Wednesday",
                actualMinutes: 60,
                roundedMinutes: 60,
              },
              {
                project: "Thursday",
                actualMinutes: 60,
                roundedMinutes: 60,
              },
              {
                project: "Friday",
                actualMinutes: 60,
                roundedMinutes: 60,
              },
            ],
          },
        ],
      });
    });

    test("should determine the beginning of week based on provided configuration", async () => {
      const analyzer = new JournalAnalyzer({
        basePath,
        workDayClassifier,
        startOfWeek: 0,
        clients,
      });
      const aggregation = await analyzer.analyzeWeek(0, {
        year: 2020,
        month: 1,
        day: 1,
      });
      expect(aggregation).toStrictEqual({
        range: "2019-12-29 to 2020-01-04",
        clients: [
          {
            client: "ClientA",
            actualMinutes: 360,
            roundedMinutes: 360,
            targetMinutes: 1440,
            periodTargetMinutes: 2400,
            projects: [
              {
                project: "Monday",
                actualMinutes: 60,
                roundedMinutes: 60,
              },
              {
                project: "Tuesday",
                actualMinutes: 60,
                roundedMinutes: 60,
              },
              {
                project: "Wednesday",
                actualMinutes: 60,
                roundedMinutes: 60,
              },
              {
                project: "Thursday",
                actualMinutes: 60,
                roundedMinutes: 60,
              },
              {
                project: "Friday",
                actualMinutes: 60,
                roundedMinutes: 60,
              },
              {
                project: "Saturday",
                actualMinutes: 60,
                roundedMinutes: 60,
              },
            ],
          },
        ],
      });
    });
  });
});
