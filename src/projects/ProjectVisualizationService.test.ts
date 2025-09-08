import { ProjectVisualizationService } from "./ProjectVisualizationService";
import { ProjectDefinition, TasksSection } from "./ProjectDefinition";
import { getWorkDayClassifier } from "../journal/workDay";

// Test interface to access private methods
interface ProjectVisualizationServiceTestInterface {
  generateMermaidDiagram: (project: ProjectDefinition) => string;
  calculateCumulativeEstimate: (
    incomingTasks: string[],
    tasks: TasksSection,
    criticalPath: string[],
  ) => number;
}

describe("ProjectVisualizationService", () => {
  const service = new ProjectVisualizationService(
    getWorkDayClassifier("general"),
  );

  describe("generateMermaidDiagram", () => {
    test("should generate diagram for empty project", () => {
      const project: ProjectDefinition = {
        admin: {
          start_date: { year: 2025, month: 1, day: 1 },
          person: {},
        },
        tasks: {},
      };
      verifyDiagram(
        project,
        `
        flowchart TD
            Start[Project Start]
            End[Project End]
            Start --> End`,
      );
    });

    test("should generate diagram for project with single task", () => {
      const project: ProjectDefinition = {
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
          },
        },
        tasks: {
          task1: {
            summary: "Task 1",
            description: "First task",
            estimate_days: { min: 1, max: 3, expected: 2 },
            status: "not-started",
            owners: ["alice"],
            dependencies: [],
          },
        },
      };

      verifyDiagram(
        project,
        `
        flowchart TD
            C0[2025-01-01]
            C1[2025-01-02]
            C0== task1 alice E:2 ==>C1`,
      );
    });

    test("should generate diagram for project with dependencies", () => {
      const project: ProjectDefinition = {
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
                  startDate: { year: 2025, month: 1, day: 1 },
                  endDate: { year: 2025, month: 12, day: 31 },
                  hoursPerDay: 8,
                },
              ],
            },
          },
        },
        tasks: {
          task1: {
            summary: "Task 1",
            description: "First task",
            estimate_days: { min: 1, max: 3, expected: 2 },
            status: "not-started",
            owners: ["alice"],
            dependencies: [],
          },
          task2: {
            summary: "Task 2",
            description: "Second task",
            estimate_days: { min: 2, max: 4, expected: 3 },
            status: "not-started",
            owners: ["bob"],
            dependencies: ["task1"],
          },
        },
      };

      verifyDiagram(
        project,
        `
        flowchart TD
            C0[2025-01-01]
            C1[2025-01-02]
            C2[2025-01-02]
            C3[2025-01-03]
            C0== task1 alice E:2 ==>C1
            C0-. bob .->C2
            C1-.->C2
            C2== task2 bob E:3 ==>C3`,
      );
    });

    test("should escape special characters in task summaries", () => {
      const project: ProjectDefinition = {
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
          },
        },
        tasks: {
          task1: {
            summary: 'Task with "quotes" and {braces}',
            description: "First task",
            estimate_days: { min: 1, max: 3, expected: 2 },
            status: "not-started",
            owners: ["alice"],
            dependencies: [],
          },
        },
      };

      verifyDiagram(
        project,
        `
        flowchart TD
            C0[2025-01-01]
            C1[2025-01-02]
            C0== task1 alice E:2 ==>C1`,
      );
    });
  });

  function verifyDiagram(project: ProjectDefinition, expectedDiagram: string) {
    const lines = expectedDiagram
      .split("\n")
      .filter((line) => line.trim().length > 0);
    const indentation = lines[0]?.match(/^\s*/)?.[0].length ?? 0;
    const trimmedDiagram = lines
      .map((line) => line.slice(indentation))
      .join("\n");

    const testService =
      service as unknown as ProjectVisualizationServiceTestInterface;
    expect(testService.generateMermaidDiagram(project).trim()).toStrictEqual(
      trimmedDiagram,
    );
  }
});
