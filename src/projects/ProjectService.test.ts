import { ProjectService } from "./ProjectService";
import { Day } from "../journal/types";

describe("ProjectService", () => {
  let service: ProjectService;
  let mockWorkDayClassifier: (day: Day) => boolean;

  const mockClients = [
    {
      client: "ClientA",
      projectFilePattern: "testResource/projects/ClientA/{id}.md",
    },
    {
      client: "ClientB",
      projectFilePattern: "/projects/ClientB/{id}.md",
    },
  ];

  beforeEach(() => {
    mockWorkDayClassifier = (day: Day) => {
      const date = new Date(day.year, day.month - 1, day.day);
      return date.getDay() !== 0 && date.getDay() !== 6; // Monday-Friday
    };

    service = new ProjectService({
      workDayClassifier: mockWorkDayClassifier,
      clients: mockClients,
    });
  });

  describe("generateProjectSummary", () => {
    it("should generate project summary for valid client and project", async () => {
      const result = await service.generateProjectSummary(
        "ClientA",
        "website-redesign",
      );

      expect(result.status).toBe("in-progress");
      expect(result.totalEstimatedDays).toBeGreaterThan(0);
      expect(result.estimatedCompletionDate).toBeDefined();
      expect(result.completionPercentage).toBeGreaterThan(0);
      expect(result.completionPercentage).toBeLessThan(100);
    });

    it("should throw error for unknown client", async () => {
      await expect(
        service.generateProjectSummary("UnknownClient", "test-project"),
      ).rejects.toThrow("Client 'UnknownClient' not found in configuration");
    });

    it("should throw error for client without project_file_pattern", async () => {
      const serviceWithoutPattern = new ProjectService({
        workDayClassifier: mockWorkDayClassifier,
        clients: [
          {
            client: "ClientC",
            projectFilePattern: "",
          },
        ],
      });

      await expect(
        serviceWithoutPattern.generateProjectSummary("ClientC", "test-project"),
      ).rejects.toThrow(
        "Client 'ClientC' does not have a project_file_pattern configured",
      );
    });

    it("should throw error for non-existent project file", async () => {
      await expect(
        service.generateProjectSummary("ClientA", "non-existent-project"),
      ).rejects.toThrow("Project file not found:");
    });
  });
});
