import { AdminSection, ProjectDefinition, Task } from "./ProjectDefinition";
import { ProjectSimulation, SimulatedProject } from "./ProjectSimulation";
import { getWorkDayClassifier } from "../journal/workDay";
import { Day } from "../journal/types";
import { compareDays } from "../util";

describe("ProjectSimulation", () => {
  const workDays = getWorkDayClassifier("general");

  test("should simulate a simple project", () => {
    testSimulation(
      {
        admin: standardAdmin(),
        tasks: {
          task1: minimalTask(["alice"], [], 2),
          task2: minimalTask(["alice"], [], 3),
        },
      },
      {
        lastDay: { year: 2025, month: 1, day: 8 },
        numCheckpoints: 3,
      },
    );
  });

  test("should optimize nodes that only have a transfer out", () => {
    testSimulation(
      {
        admin: {
          start_date: { year: 2025, month: 1, day: 1 },
          person: {
            alice: {
              availability: [
                {
                  startDate: { year: 2025, month: 1, day: 1 },
                  endDate: { year: 2025, month: 12, day: 31 },
                  hoursPerDay: 8,
                },
              ],
            },
            bob: {
              availability: [
                {
                  startDate: { year: 2025, month: 2, day: 1 },
                  endDate: { year: 2025, month: 12, day: 31 },
                  hoursPerDay: 8,
                },
              ],
            },
          },
        },
        tasks: {
          task1: minimalTask(["alice"], [], 2),
          task2: minimalTask(["bob"], [], 3),
          task3: minimalTask(["bob"], ["task1", "task2"], 3),
        },
      },
      {
        lastDay: { year: 2025, month: 2, day: 11 },
        numCheckpoints: 4,
      },
    );
  });

  test("should prioritize the critical path", () => {
    const result = testSimulation(
      {
        admin: standardAdmin(),
        tasks: {
          task1: minimalTask(["alice", "bob"], [], 2),
          task2: minimalTask(["alice", "bob"], [], 5),
          task3: minimalTask(["alice"], ["task1", "task2"], 1),
        },
      },
      {
        lastDay: { year: 2025, month: 1, day: 9 },
        numCheckpoints: 5,
      },
    );
    expect(result.checkpoints[0].outgoing[0]).toStrictEqual({
      from: 0,
      to: 4,
      taskId: "task2",
      personId: "alice",
      startDay: { year: 2025, month: 1, day: 1 },
      endDay: { year: 2025, month: 1, day: 8 },
      estimate: 5,
      float: 0,
    });
    expect(result.checkpoints[1].outgoing[0]).toStrictEqual({
      from: 2,
      to: 3,
      taskId: "task1",
      personId: "bob",
      startDay: { year: 2025, month: 1, day: 1 },
      endDay: { year: 2025, month: 1, day: 3 },
      estimate: 2,
      float: 3,
    });
  });

  function testSimulation(
    project: ProjectDefinition,
    expectedResult: SimulationResult,
  ): SimulatedProject {
    const simulation = new ProjectSimulation(project, workDays);
    const result = simulation.run();
    const analysis = analyzeSimulationResult(result);
    expect(analysis).toEqual(expectedResult);
    return result;
  }

  function analyzeSimulationResult(result: SimulatedProject): SimulationResult {
    return {
      lastDay: result.checkpoints
        .map((it) => it.day)
        .sort((a, b) => compareDays(b, a))[0],
      numCheckpoints: result.checkpoints.length,
    };
  }

  function standardAdmin(): AdminSection {
    return {
      start_date: { year: 2025, month: 1, day: 1 },
      person: {
        alice: {
          availability: [
            {
              startDate: { year: 2025, month: 1, day: 1 },
              endDate: { year: 2025, month: 12, day: 31 },
              hoursPerDay: 8,
            },
          ],
        },
        bob: {
          availability: [
            {
              startDate: { year: 2025, month: 1, day: 1 },
              endDate: { year: 2025, month: 12, day: 31 },
              hoursPerDay: 8,
            },
          ],
        },
      },
    };
  }

  let taskId = 1;
  function minimalTask(
    owners: string[],
    dependencies: string[],
    estimate: number,
  ): Task {
    return {
      summary: "" + taskId++,
      description: "",
      estimate_days: { min: estimate, max: estimate, expected: estimate },
      status: "not-started",
      owners,
      dependencies,
    };
  }
});

type SimulationResult = {
  lastDay: Day;
  numCheckpoints: number;
};
