import { ProjectFileReader } from "./ProjectFileReader";

describe("ProjectFileReader", () => {
  let reader: ProjectFileReader;

  beforeEach(() => {
    reader = new ProjectFileReader({
      client: "TestClient",
      projectFilePattern: "testResource/projects/ClientA/{id}.md",
    });
  });

  describe("getProjectFilePath", () => {
    it("should replace {id} placeholder with project ID", () => {
      const filePath = reader.getProjectFilePath("myproject");
      expect(filePath).toBe("testResource/projects/ClientA/myproject.md");
    });
  });

  describe("readProject", () => {
    it("should throw error when file does not exist", async () => {
      await expect(reader.readProject("missing")).rejects.toThrow(
        "Project file not found: testResource/projects/ClientA/missing.md",
      );
    });

    it("should parse a valid project file", async () => {
      const project = await reader.readProject("website-redesign");

      expect(project.admin.start_date).toEqual({
        year: 2025,
        month: 1,
        day: 6,
      });

      expect(project.admin.person.alice).toBeDefined();
      expect(project.admin.person.alice.availability).toHaveLength(2);
      expect(project.admin.person.alice.availability[0]).toEqual({
        startDate: { year: 2025, month: 1, day: 6 },
        endDate: { year: 2025, month: 2, day: 28 },
        hoursPerDay: 8,
      });

      expect(project.tasks.research).toBeDefined();
      expect(project.tasks.research.summary).toBe("Research and user analysis");
      expect(project.tasks.research.status).toBe("complete");
      expect(project.tasks.research.estimate_days).toEqual({
        min: 3,
        max: 5,
        expected: 4,
      });

      expect(project.tasks.design).toBeDefined();
      expect(project.tasks.design.status).toBe("in-progress");
      expect(project.tasks.design.dependencies).toEqual(["research"]);
    });

    it("should parse another valid project file", async () => {
      const project = await reader.readProject("mobile-app");

      expect(project.admin.start_date).toEqual({
        year: 2025,
        month: 2,
        day: 1,
      });

      expect(project.admin.person.charlie).toBeDefined();
      expect(project.admin.person.diana).toBeDefined();

      expect(project.tasks.planning).toBeDefined();
      expect(project.tasks.planning.status).toBe("not-started");
      expect(project.tasks.planning.dependencies).toEqual([]);

      expect(project.tasks.testing).toBeDefined();
      expect(project.tasks.testing.dependencies).toEqual([
        "ios_development",
        "android_development",
      ]);
    });
  });
});
