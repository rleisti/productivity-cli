import JournalDay from "./JournalDay";

describe("JournalDay", () => {
  test("should accept empty content", () => {
    const day = JournalDay.read("2020-01-01", "");
    expect(day.getDate()).toBe("2020-01-01");
    expect(day.getClients().length).toBe(0);
  });

  test("should accept irrelevant content", () => {
    const day = JournalDay.read(
      "2020-01-01",
      `
    Some journal entry
    lines that do not 
    contain time sheet information.`,
    );
    expect(day.getClients().length).toBe(0);
  });

  test("should accept a correctly formatted time sheet entry", () => {
    const day = JournalDay.read(
      "2020-01-01",
      `
      Timesheet:
      08:30 MyClient:TheirProject:task   I did some things for this task`,
    );
    expect(day.getClients()).toEqual([
      {
        client: "MyClient",
        projects: [
          {
            project: "TheirProject",
            activities: [
              {
                activity: "task",
                minutes: 0,
              },
            ],
          },
        ],
      },
    ]);
  });
});
