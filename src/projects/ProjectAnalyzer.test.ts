import { ProjectAnalyzer } from "./ProjectAnalyzer";
import { ProjectDefinition, ProjectSummary } from "./ProjectDefinition";
import { Day } from "../journal/types";
import { ProjectSimulation } from "./ProjectSimulation";

describe("ProjectAnalyzer", () => {
  let analyzer: ProjectAnalyzer;

  const mockWorkDayClassifier = (day: Day): boolean => {
    const date = new Date(day.year, day.month - 1, day.day);
    return date.getDay() !== 0 && date.getDay() !== 6; // Monday-Friday
  };

  beforeEach(() => {
    analyzer = new ProjectAnalyzer(mockWorkDayClassifier);
  });

  describe("analyzeProject", () => {
    test("should calculate project status as not-started when all tasks are not-started", () => {
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

      const summary = analyzeProject(project);

      expect(summary.status).toBe("not-started");
      expect(summary.completionPercentage).toBe(0);
    });

    test("should calculate project status as complete when all tasks are complete", () => {
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
            status: "complete",
            owners: ["alice"],
            dependencies: [],
          },
        },
      };

      const summary = analyzeProject(project);

      expect(summary.status).toBe("complete");
      expect(summary.completionPercentage).toBe(100);
    });

    test("should calculate project status as in-progress when some tasks are in-progress or complete", () => {
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
            status: "complete",
            owners: ["alice"],
            dependencies: [],
          },
          task2: {
            summary: "Task 2",
            description: "Second task",
            estimate_days: { min: 2, max: 4, expected: 3 },
            status: "in-progress",
            owners: ["bob"],
            dependencies: ["task1"],
          },
        },
      };

      const summary = analyzeProject(project);

      expect(summary.status).toBe("in-progress");
    });

    test("should report total estimated days", () => {
      const project: ProjectDefinition = {
        admin: {
          start_date: { year: 2025, month: 1, day: 1 },
          person: {
            alice: {
              availability: [
                {
                  startDate: { year: 2025, month: 1, day: 1 },
                  endDate: { year: 2025, month: 2, day: 1 },
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
            estimate_days: { min: 6, max: 6, expected: 6 },
            status: "not-started",
            owners: ["alice"],
            dependencies: [],
          },
        },
      };

      const summary = analyzeProject(project);
      expect(summary.estimatedCompletionDate).toStrictEqual({
        year: 2025,
        month: 1,
        day: 9,
      });
      expect(summary.totalEstimatedDays).toBe(6);
    });

    test("should calculate completion percentage correctly", () => {
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
            status: "complete",
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

      const summary = analyzeProject(project);

      // Task 1 complete: 2 days, Task 2 not complete: 3 days
      // Completion: 2 / (2 + 3) = 40%
      expect(summary.completionPercentage).toBe(40);
    });

    test("should handle empty project", () => {
      const project: ProjectDefinition = {
        admin: {
          start_date: { year: 2025, month: 1, day: 1 },
          person: {},
        },
        tasks: {},
      };

      const summary = analyzeProject(project);

      expect(summary.status).toBe("not-started");
      expect(summary.totalEstimatedDays).toBe(0);
      expect(summary.completionPercentage).toBe(0);
    });

    function analyzeProject(project: ProjectDefinition): ProjectSummary {
      const simulatedProject = new ProjectSimulation(
        project,
        mockWorkDayClassifier,
      ).run();
      return analyzer.analyzeProject(project, simulatedProject);
    }
  });
});
