import { ProjectAnalyzer } from "./ProjectAnalyzer";
import { ProjectDefinition } from "./ProjectDefinition";
import { Day } from "../journal/types";

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
    it("should calculate project status as not-started when all tasks are not-started", () => {
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

      const summary = analyzer.analyzeProject(project);

      expect(summary.status).toBe("not-started");
      expect(summary.completionPercentage).toBe(0);
    });

    it("should calculate project status as complete when all tasks are complete", () => {
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

      const summary = analyzer.analyzeProject(project);

      expect(summary.status).toBe("complete");
      expect(summary.completionPercentage).toBe(100);
    });

    it("should calculate project status as in-progress when some tasks are in-progress or complete", () => {
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

      const summary = analyzer.analyzeProject(project);

      expect(summary.status).toBe("in-progress");
    });

    it("should calculate total estimated days using PERT formula", () => {
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

      const summary = analyzer.analyzeProject(project);

      // PERT formula: (min + max + 4 * expected) / 6
      // Task 1: (1 + 3 + 4*2) / 6 = 12/6 = 2
      // Task 2: (2 + 4 + 4*3) / 6 = 18/6 = 3
      // Total: 5 (both tasks are on critical path)
      expect(summary.totalEstimatedDays).toBe(5);
    });

    it("should calculate completion percentage correctly", () => {
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

      const summary = analyzer.analyzeProject(project);

      // Task 1 complete: 2 days, Task 2 not complete: 3 days
      // Completion: 2 / (2 + 3) = 40%
      expect(summary.completionPercentage).toBe(40);
    });

    it("should calculate completion date excluding weekends", () => {
      const project: ProjectDefinition = {
        admin: {
          start_date: { year: 2025, month: 1, day: 1 }, // Wednesday
          person: {},
        },
        tasks: {
          task1: {
            summary: "Task 1",
            description: "First task",
            estimate_days: { min: 5, max: 5, expected: 5 }, // Exactly 5 work days
            status: "not-started",
            owners: ["alice"],
            dependencies: [],
          },
        },
      };

      const summary = analyzer.analyzeProject(project);

      // Starting Wednesday Jan 1, 2025, adding 5 work days
      // Should end on Wednesday Jan 8, 2025 (skipping weekend)
      expect(summary.estimatedCompletionDate).toEqual({
        year: 2025,
        month: 1,
        day: 8,
      });
    });

    it("should handle empty project", () => {
      const project: ProjectDefinition = {
        admin: {
          start_date: { year: 2025, month: 1, day: 1 },
          person: {},
        },
        tasks: {},
      };

      const summary = analyzer.analyzeProject(project);

      expect(summary.status).toBe("not-started");
      expect(summary.totalEstimatedDays).toBe(0);
      expect(summary.completionPercentage).toBe(0);
    });
  });
});
