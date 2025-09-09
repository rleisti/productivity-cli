import { ProjectVisualizationService } from "./ProjectVisualizationService";
import { TasksSection } from "./ProjectDefinition";
import { getWorkDayClassifier } from "../journal/workDay";
import { SimulatedProject } from "./ProjectSimulation";

// Test interface to access private methods
interface ProjectVisualizationServiceTestInterface {
  generateMermaidDiagram: (project: SimulatedProject) => string;
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
      const project: SimulatedProject = {
        checkpoints: [],
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
      const project: SimulatedProject = {
        checkpoints: [
          {
            id: 0,
            day: { year: 2025, month: 1, day: 1 },
            freePeople: [],
            completedTasks: [],
            incoming: [],
            outgoing: [
              {
                taskId: "task1",
                personId: "alice",
                float: 0,
                estimate: 2,
                from: 0,
                to: 1,
                startDay: { year: 2025, month: 1, day: 1 },
                endDay: { year: 2025, month: 2, day: 2 },
              },
            ],
          },
          {
            id: 1,
            day: { year: 2025, month: 1, day: 2 },
            freePeople: [],
            completedTasks: [],
            incoming: [],
            outgoing: [],
          },
        ],
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

    test("should escape special characters in task summaries", () => {
      const project: SimulatedProject = {
        checkpoints: [
          {
            id: 0,
            day: { year: 2025, month: 1, day: 1 },
            freePeople: [],
            completedTasks: [],
            incoming: [],
            outgoing: [
              {
                taskId: "{task1}",
                personId: '"alice"',
                float: 0,
                estimate: 2,
                from: 0,
                to: 1,
                startDay: { year: 2025, month: 1, day: 1 },
                endDay: { year: 2025, month: 2, day: 2 },
              },
            ],
          },
          {
            id: 1,
            day: { year: 2025, month: 1, day: 2 },
            freePeople: [],
            completedTasks: [],
            incoming: [],
            outgoing: [],
          },
        ],
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

  function verifyDiagram(
    simulation: SimulatedProject,
    expectedDiagram: string,
  ) {
    const lines = expectedDiagram
      .split("\n")
      .filter((line) => line.trim().length > 0);
    const indentation = lines[0]?.match(/^\s*/)?.[0].length ?? 0;
    const trimmedDiagram = lines
      .map((line) => line.slice(indentation))
      .join("\n");

    const testService =
      service as unknown as ProjectVisualizationServiceTestInterface;
    expect(testService.generateMermaidDiagram(simulation).trim()).toStrictEqual(
      trimmedDiagram,
    );
  }
});
