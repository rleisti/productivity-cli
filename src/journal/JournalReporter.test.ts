import JournalReporter from "./JournalReporter";
import JournalAnalyzer from "./JournalAnalyzer";

describe("JournalReporter", () => {
  const analyzer = new JournalAnalyzer({
    basePath: "./testResource/journal",
    workDayClassifier: (day) => {
      const date = new Date(day.year, day.month - 1, day.day);
      return date.getDay() !== 0 && date.getDay() !== 6;
    },
  });
  const reporter = new JournalReporter({
    clients: [
      {
        client: "RoundUpClient",
        targetHoursPerDay: 4,
        activityRoundingIncrement: 15,
        activityRoundingMethod: "roundUp",
      },
      {
        client: "RoundClient",
        targetHoursPerDay: 2,
        activityRoundingIncrement: 15,
        activityRoundingMethod: "round",
      },
    ],
  });

  describe("report", () => {
    test("should accept empty data", () => {
      const report = reporter.report({
        range: "empty",
        clients: [],
        workDaysInPeriod: 0,
        workDaysElapsed: 0,
      });
      expect(report).toStrictEqual({ range: "empty", clients: [] });
    });

    test("should accept real data", async () => {
      const data = await analyzer.analyzeMonth({ year: 2021, month: 1 });
      const report = reporter.report(data);
      expect(report).toStrictEqual({
        range: "2021-01",
        clients: [
          {
            client: "DefaultClient",
            actualMinutes: 20,
            roundedMinutes: 20,
            targetMinutes: 10080,
            periodTargetMinutes: 10080,
            projects: [
              {
                project: "Project",
                actualMinutes: 20,
                roundedMinutes: 20,
              },
            ],
          },
          {
            client: "RoundUpClient",
            actualMinutes: 20,
            roundedMinutes: 30,
            targetMinutes: 5040,
            periodTargetMinutes: 5040,
            projects: [
              {
                project: "Project",
                actualMinutes: 20,
                roundedMinutes: 30,
              },
            ],
          },
          {
            client: "RoundClient",
            actualMinutes: 20,
            roundedMinutes: 15,
            targetMinutes: 2520,
            periodTargetMinutes: 2520,
            projects: [
              {
                project: "Project",
                actualMinutes: 20,
                roundedMinutes: 15,
              },
            ],
          },
        ],
      });
    });
  });
});
