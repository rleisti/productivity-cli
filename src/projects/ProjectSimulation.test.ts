import { ProjectDefinition, Task } from "./ProjectDefinition";
import { ProjectSimulation, SimulatedProject } from "./ProjectSimulation";
import { getWorkDayClassifier } from "../journal/workDay";
import { Day } from "../journal/types";
import { compareDays } from "../util";

describe("ProjectSimulation", () => {
  const workDays = getWorkDayClassifier("general");

  test("should simulate a project", () => {
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
        lastDay: { year: 2025, month: 2, day: 5 },
        numCheckpoints: 5,
      },
    );
  });

  function testSimulation(
    project: ProjectDefinition,
    expectedResult: SimulationResult,
  ) {
    const simulation = new ProjectSimulation(project, workDays);
    const result = simulation.run();
    const analysis = analyzeSimulationResult(result);
    expect(analysis).toEqual(expectedResult);
  }

  function analyzeSimulationResult(result: SimulatedProject): SimulationResult {
    return {
      lastDay: result.checkpoints
        .map((it) => it.day)
        .sort((a, b) => compareDays(b, a))[0],
      numCheckpoints: result.checkpoints.length,
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
