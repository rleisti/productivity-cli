import {
  isPersonId,
  resolvePeopleWithRole,
  expandTaskOwners,
  calculateTaskEstimate,
  calculateTotalEstimate,
} from "./util";
import { ProjectDefinition } from "./ProjectDefinition";

describe("util", () => {
  const mockProject: ProjectDefinition = {
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
          roles: ["developer", "designer"],
        },
        bob: {
          availability: [
            {
              startDate: { year: 2025, month: 1, day: 1 },
              endDate: { year: 2025, month: 12, day: 31 },
              hoursPerDay: 8,
            },
          ],
          roles: ["developer"],
        },
        charlie: {
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
        description: "Description 1",
        estimate_days: { min: 1, max: 3, expected: 2 },
        status: "not-started",
        owners: ["alice"],
        dependencies: [],
      },
    },
  };

  describe("isPersonId", () => {
    it("should return true for person IDs", () => {
      expect(isPersonId("alice", mockProject)).toBe(true);
      expect(isPersonId("bob", mockProject)).toBe(true);
      expect(isPersonId("charlie", mockProject)).toBe(true);
    });

    it("should return false for role IDs", () => {
      expect(isPersonId("developer", mockProject)).toBe(false);
      expect(isPersonId("designer", mockProject)).toBe(false);
      expect(isPersonId("unknown", mockProject)).toBe(false);
    });
  });

  describe("resolvePeopleWithRole", () => {
    it("should return people with the specified role", () => {
      const developers = resolvePeopleWithRole("developer", mockProject);
      expect(developers).toEqual(["alice", "bob"]);
    });

    it("should return empty array for unknown role", () => {
      const unknown = resolvePeopleWithRole("unknown", mockProject);
      expect(unknown).toEqual([]);
    });
  });

  describe("expandTaskOwners", () => {
    it("should return person IDs unchanged", () => {
      const owners = expandTaskOwners(["alice", "bob"], mockProject);
      expect(owners).toEqual(["alice", "bob"]);
    });

    it("should expand role IDs to person IDs", () => {
      const owners = expandTaskOwners(["developer"], mockProject);
      expect(owners).toEqual(["alice", "bob"]);
    });

    it("should handle mixed person and role IDs", () => {
      const owners = expandTaskOwners(["alice", "developer"], mockProject);
      expect(owners).toEqual(["alice", "bob"]); // Duplicates removed
    });

    it("should remove duplicates", () => {
      const owners = expandTaskOwners(["alice", "alice"], mockProject);
      expect(owners).toEqual(["alice"]);
    });

    it("should handle multiple roles", () => {
      const owners = expandTaskOwners(["developer", "designer"], mockProject);
      expect(owners).toEqual(["alice", "bob"]); // alice appears once even though she has both roles
    });
  });

  describe("calculateTaskEstimate", () => {
    it("should calculate using PERT formula", () => {
      const estimate = calculateTaskEstimate({ min: 1, max: 5, expected: 3 });
      expect(estimate).toBeCloseTo((1 + 5 + 4 * 3) / 6, 5);
    });
  });

  describe("calculateTotalEstimate", () => {
    it("should sum estimates for multiple tasks", () => {
      const tasks = {
        task1: {
          summary: "Task 1",
          description: "",
          estimate_days: { min: 1, max: 3, expected: 2 },
          status: "not-started" as const,
          owners: ["alice"],
          dependencies: [],
        },
        task2: {
          summary: "Task 2",
          description: "",
          estimate_days: { min: 2, max: 4, expected: 3 },
          status: "not-started" as const,
          owners: ["bob"],
          dependencies: [],
        },
      };

      const total = calculateTotalEstimate(["task1", "task2"], tasks);
      const expected = (1 + 3 + 4 * 2) / 6 + (2 + 4 + 4 * 3) / 6;
      expect(total).toBeCloseTo(expected, 5);
    });
  });
});
