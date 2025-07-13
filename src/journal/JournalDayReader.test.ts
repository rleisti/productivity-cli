import JournalDayReader from "./JournalDayReader";

describe("JournalDayReader", () => {
  const reader = new JournalDayReader({
    clients: [
      {
        client: "RoundUp",
        activityRoundingIncrement: 30,
        activityRoundingMethod: "roundUp",
      },
      {
        client: "Round",
        activityRoundingIncrement: 15,
        activityRoundingMethod: "round",
      },
      {
        client: "RoundNone",
        activityRoundingIncrement: 5,
        activityRoundingMethod: "none",
      },
    ],
  });

  test("should accept empty content", () => {
    expect(reader.read("2020-01-01", "")).toStrictEqual({
      date: "2020-01-01",
      clients: [],
    });
  });

  test("should accept irrelevant content", () => {
    expect(
      reader.read(
        "2020-01-01",
        `
    Some journal entry
    lines that do not 
    contain time sheet information.`,
      ),
    ).toStrictEqual({ date: "2020-01-01", clients: [] });
  });

  test("should accept a correctly formatted time sheet entry", () => {
    expect(
      reader.read(
        "2020-01-01",
        `
      Timesheet:
      08:30 MyClient:TheirProject:task   I did some things for this task`,
      ),
    ).toStrictEqual({
      date: "2020-01-01",
      clients: [
        {
          client: "MyClient",
          minutes: 0,
          roundedMinutes: 0,
          projects: [
            {
              project: "TheirProject",
              minutes: 0,
              roundedMinutes: 0,
              activities: [
                {
                  activity: "task",
                  minutes: 0,
                  roundedMinutes: 0,
                  notes: ["I did some things for this task"],
                },
              ],
            },
          ],
        },
      ],
    });
  });

  test("should accept a timesheet entry with no note", () => {
    expect(
      reader.read(
        "2020-01-01",
        `
      Timesheet:
       08:30 MyClient:TheirProject:task
       09:00 break`,
      ),
    ).toStrictEqual({
      date: "2020-01-01",
      clients: [
        {
          client: "MyClient",
          minutes: 30,
          roundedMinutes: 30,
          projects: [
            {
              project: "TheirProject",
              minutes: 30,
              roundedMinutes: 30,
              activities: [
                {
                  activity: "task",
                  minutes: 30,
                  roundedMinutes: 30,
                  notes: [""],
                },
              ],
            },
          ],
        },
      ],
    });
  });

  test("should accept multiple time sheet entries", () => {
    expect(
      reader.read(
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
      ),
    ).toStrictEqual({
      date: "2020-01-01",
      clients: [
        {
          client: "MyClient",
          minutes: 300,
          roundedMinutes: 300,
          projects: [
            {
              project: "TheirProject",
              minutes: 230,
              roundedMinutes: 230,
              activities: [
                {
                  activity: "task1",
                  minutes: 185,
                  roundedMinutes: 185,
                  notes: ["Some notes", "New notes"],
                },
                {
                  activity: "task3",
                  minutes: 45,
                  roundedMinutes: 45,
                  notes: ["Notes"],
                },
              ],
            },
            {
              project: "OtherProject",
              minutes: 70,
              roundedMinutes: 70,
              activities: [
                {
                  activity: "task2",
                  minutes: 70,
                  roundedMinutes: 70,
                  notes: ["Some other notes", "Different notes"],
                },
              ],
            },
          ],
        },
      ],
    });
  });

  test("should accept special character in activity name", () => {
    expect(
      reader.read(
        "2020-01-01",
        `
      Timesheet:
      08:30 MyClient:TheirProject:task-1_a   Some notes
      09:00 break
      `,
      ),
    ).toStrictEqual({
      date: "2020-01-01",
      clients: [
        {
          client: "MyClient",
          minutes: 30,
          roundedMinutes: 30,
          projects: [
            {
              project: "TheirProject",
              minutes: 30,
              roundedMinutes: 30,
              activities: [
                {
                  activity: "task-1_a",
                  minutes: 30,
                  roundedMinutes: 30,
                  notes: ["Some notes"],
                },
              ],
            },
          ],
        },
      ],
    });
  });

  test("should round up minutes and sum up to project and client level as configured", () => {
    expect(
      reader.read(
        "2020-01-01",
        `
        Timesheet:
        08:00 RoundUp:ProjectA:taskA
        08:10 RoundUp:ProjectA:taskA
        08:20 RoundUp:ProjectA:taskB
        08:44 RoundUp:ProjectB:taskC
        08:55 break
        `,
      ),
    ).toStrictEqual({
      date: "2020-01-01",
      clients: [
        {
          client: "RoundUp",
          minutes: 55,
          roundedMinutes: 90,
          projects: [
            {
              project: "ProjectA",
              minutes: 44,
              roundedMinutes: 60,
              activities: [
                {
                  activity: "taskA",
                  minutes: 20,
                  roundedMinutes: 30,
                  notes: [""],
                },
                {
                  activity: "taskB",
                  minutes: 24,
                  roundedMinutes: 30,
                  notes: [""],
                },
              ],
            },
            {
              project: "ProjectB",
              minutes: 11,
              roundedMinutes: 30,
              activities: [
                {
                  activity: "taskC",
                  minutes: 11,
                  roundedMinutes: 30,
                  notes: [""],
                },
              ],
            },
          ],
        },
      ],
    });
  });

  test("should round minutes and sum up to project and client level as configured", () => {
    expect(
      reader.read(
        "2020-01-01",
        `
        Timesheet:
        08:00 Round:ProjectA:taskA
        08:10 Round:ProjectA:taskA
        08:20 Round:ProjectA:taskB
        08:44 Round:ProjectB:taskC
        08:55 break
        `,
      ),
    ).toStrictEqual({
      date: "2020-01-01",
      clients: [
        {
          client: "Round",
          minutes: 55,
          roundedMinutes: 60,
          projects: [
            {
              project: "ProjectA",
              minutes: 44,
              roundedMinutes: 45,
              activities: [
                {
                  activity: "taskA",
                  minutes: 20,
                  roundedMinutes: 15,
                  notes: [""],
                },
                {
                  activity: "taskB",
                  minutes: 24,
                  roundedMinutes: 30,
                  notes: [""],
                },
              ],
            },
            {
              project: "ProjectB",
              minutes: 11,
              roundedMinutes: 15,
              activities: [
                {
                  activity: "taskC",
                  minutes: 11,
                  roundedMinutes: 15,
                  notes: [""],
                },
              ],
            },
          ],
        },
      ],
    });
  });

  test("should not round minutes and sum up to project and client level as configured", () => {
    expect(
      reader.read(
        "2020-01-01",
        `
        Timesheet:
        08:00 RoundNone:ProjectA:taskA
        08:10 RoundNone:ProjectA:taskA
        08:20 RoundNone:ProjectA:taskB
        08:44 RoundNone:ProjectB:taskC
        08:55 break
        `,
      ),
    ).toStrictEqual({
      date: "2020-01-01",
      clients: [
        {
          client: "RoundNone",
          minutes: 55,
          roundedMinutes: 55,
          projects: [
            {
              project: "ProjectA",
              minutes: 44,
              roundedMinutes: 44,
              activities: [
                {
                  activity: "taskA",
                  minutes: 20,
                  roundedMinutes: 20,
                  notes: [""],
                },
                {
                  activity: "taskB",
                  minutes: 24,
                  roundedMinutes: 24,
                  notes: [""],
                },
              ],
            },
            {
              project: "ProjectB",
              minutes: 11,
              roundedMinutes: 11,
              activities: [
                {
                  activity: "taskC",
                  minutes: 11,
                  roundedMinutes: 11,
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
