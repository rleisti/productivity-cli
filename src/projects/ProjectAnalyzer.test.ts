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

      const summary = analyzer.analyzeProject(project);

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

      const summary = analyzer.analyzeProject(project);

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

      const summary = analyzer.analyzeProject(project);

      expect(summary.status).toBe("in-progress");
    });

    test("should calculate total estimated days using PERT formula", () => {
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
      expect(summary.totalEstimatedDays).toBe(5);
    });

    test("should calculate estimate using the critical path", () => {
      const project: ProjectDefinition = {
        admin: {
          start_date: { year: 2025, month: 1, day: 1 },
          person: {},
        },
        tasks: {
          task1: {
            //  2 days
            summary: "Task 1",
            description: "First task",
            estimate_days: { min: 1, max: 3, expected: 2 }, // Estimated 2 days
            status: "not-started",
            owners: ["alice"],
            dependencies: [],
          },
          task2: {
            //  3 days (critical path)
            summary: "Task 2",
            description: "Second task",
            estimate_days: { min: 2, max: 4, expected: 3 }, // Estimated 3 days
            status: "not-started",
            owners: ["bob"],
            dependencies: [],
          },
          task3: {
            // 4 days
            summary: "Task 3",
            description: "Third task",
            estimate_days: { min: 1, max: 3, expected: 2 }, // Estimated 2 days
            status: "not-started",
            owners: ["alice"],
            dependencies: ["task1"],
          },
          task4: {
            // 6 days (critical path)
            summary: "Task 4",
            description: "Fourth task",
            estimate_days: { min: 2, max: 4, expected: 3 }, // Estimated 3 days
            status: "not-started",
            owners: ["bob"],
            dependencies: ["task2"],
          },
          task5: {
            // 9 days (critical path)
            summary: "Task 5",
            description: "Fifth task",
            estimate_days: { min: 2, max: 4, expected: 3 }, // Estimated 3 days
            status: "not-started",
            owners: ["bob"],
            dependencies: ["task3", "task4"],
          },
        },
      };

      const summary = analyzer.analyzeProject(project);
      expect(summary.totalEstimatedDays).toBe(9);
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

      const summary = analyzer.analyzeProject(project);

      // Task 1 complete: 2 days, Task 2 not complete: 3 days
      // Completion: 2 / (2 + 3) = 40%
      expect(summary.completionPercentage).toBe(40);
    });

    test("should calculate completion date excluding weekends", () => {
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

    test("should handle empty project", () => {
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
