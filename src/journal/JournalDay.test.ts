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
                notes: ["I did some things for this task"],
              },
            ],
          },
        ],
      },
    ]);
  });

  test("should accept a timesheet entry with no note", () => {
    const day = JournalDay.read(
      "2020-01-01",
      `
      Timesheet:
       08:30 MyClient:TheirProject:task
       09:00 break`,
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
                minutes: 30,
                notes: [""],
              },
            ],
          },
        ],
      },
    ]);
  });

  test("should accept multiple time sheet entries", () => {
    const day = JournalDay.read(
      "2020-01-01",
      `
      Timesheet:
      08:30 MyClient:TheirProject:task1   Some notes
      10:40 MyClient:OtherProject:task2   Some other notes
      11:30 MyClient:TheirProject:task1   Some notes
      12:10 MyClient:OtherProject:task2   Different notes
      12:30 break
      13:00 MyClient:TheirProject:task1   New notes
      13:15 MyClient:TheirProject:task3   Notes
      14:00 break
      `,
    );
    expect(day.getClients()).toEqual([
      {
        client: "MyClient",
        projects: [
          {
            project: "TheirProject",
            activities: [
              {
                activity: "task1",
                minutes: 185,
                notes: ["Some notes", "New notes"],
              },
              {
                activity: "task3",
                minutes: 45,
                notes: ["Notes"],
              },
            ],
          },
          {
            project: "OtherProject",
            activities: [
              {
                activity: "task2",
                minutes: 70,
                notes: ["Some other notes", "Different notes"],
              },
            ],
          },
        ],
      },
    ]);
  });
});
