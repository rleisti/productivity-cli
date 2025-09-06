import { ProjectVisualizationService } from "./ProjectVisualizationService";
import { ProjectDefinition, TasksSection } from "./ProjectDefinition";

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
  let service: ProjectVisualizationService;

  const mockCalculateTaskEstimate = (task: {
    estimate_days: { min: number; max: number; expected: number };
  }): number => {
    return (
      (task.estimate_days.min +
        task.estimate_days.max +
        4 * task.estimate_days.expected) /
      6
    );
  };

  const mockFindCriticalPath = (tasks: TasksSection): string[] => {
    // Simple mock that returns tasks in dependency order
    const taskIds = Object.keys(tasks);
    return taskIds.sort((a, b) => {
      if (tasks[b].dependencies.includes(a)) return -1;
      if (tasks[a].dependencies.includes(b)) return 1;
      return 0;
    });
  };

  beforeEach(() => {
    service = new ProjectVisualizationService({
      calculateTaskEstimate: mockCalculateTaskEstimate,
      findCriticalPath: mockFindCriticalPath,
    });
  });

  describe("generateMermaidDiagram", () => {
    test("should generate diagram for empty project", () => {
      const project: ProjectDefinition = {
        admin: {
          start_date: { year: 2025, month: 1, day: 1 },
          person: {},
        },
        tasks: {},
      };

      // Access private method for testing
      const testService =
        service as unknown as ProjectVisualizationServiceTestInterface;
      const diagram = testService.generateMermaidDiagram(project);

      expect(diagram).toContain("flowchart TD");
      expect(diagram).toContain("Start[Project Start]");
      expect(diagram).toContain("End[Project End]");
    });

    test("should generate diagram for project with single task", () => {
      const project: ProjectDefinition = {
        admin: {
          start_date: { year: 2025, month: 1, day: 1 },
          person: {},
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

      const testService =
        service as unknown as ProjectVisualizationServiceTestInterface;
      const diagram = testService.generateMermaidDiagram(project);

      expect(diagram).toContain("flowchart TD");
      expect(diagram).toContain("Task 1");
    });

    test("should generate diagram for project with dependencies", () => {
      const project: ProjectDefinition = {
        admin: {
          start_date: { year: 2025, month: 1, day: 1 },
          person: {},
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

      const testService =
        service as unknown as ProjectVisualizationServiceTestInterface;
      const diagram = testService.generateMermaidDiagram(project);

      expect(diagram).toContain("flowchart TD");
      expect(diagram).toContain("Task 1");
      expect(diagram).toContain("Task 2");
    });

    test("should escape special characters in task summaries", () => {
      const project: ProjectDefinition = {
        admin: {
          start_date: { year: 2025, month: 1, day: 1 },
          person: {},
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

      const testService =
        service as unknown as ProjectVisualizationServiceTestInterface;
      const diagram = testService.generateMermaidDiagram(project);

      // Should not contain the problematic characters
      expect(diagram).not.toContain('"');
      expect(diagram).not.toContain("{");
      expect(diagram).not.toContain("}");
    });
  });

  describe("calculateCumulativeEstimate", () => {
    test("should return 0 for no incoming tasks", () => {
      const tasks: TasksSection = {};
      const criticalPath: string[] = [];

      const testService =
        service as unknown as ProjectVisualizationServiceTestInterface;
      const result = testService.calculateCumulativeEstimate(
        [],
        tasks,
        criticalPath,
      );

      expect(result).toBe(0);
    });

    test("should calculate cumulative estimate correctly", () => {
      const tasks: TasksSection = {
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
      };
      const criticalPath = ["task1", "task2"];

      const testService =
        service as unknown as ProjectVisualizationServiceTestInterface;
      const result = testService.calculateCumulativeEstimate(
        ["task2"],
        tasks,
        criticalPath,
      );

      // Should sum task1 (2 days) + task2 (3 days) = 5 days
      expect(result).toBe(5);
    });
  });
});
