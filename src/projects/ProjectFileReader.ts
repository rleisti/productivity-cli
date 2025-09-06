import * as fs from "node:fs";
import * as toml from "toml";
import {
  ProjectDefinition,
  AdminSection,
  TasksSection,
  TaskStatus,
  Person,
  PersonAvailability,
} from "./ProjectDefinition";
import { Day } from "../journal/types";

export interface ProjectClientConfiguration {
  /** The client identifier */
  client: string;
  /** The path pattern for project definition files */
  projectFilePattern: string;
}

export class ProjectFileReader {
  private config: ProjectClientConfiguration;

  constructor(config: ProjectClientConfiguration) {
    this.config = config;
  }

  /**
   * Get the file path for a project definition file
   */
  public getProjectFilePath(projectId: string): string {
    return this.config.projectFilePattern.replace(/\{id}/g, projectId);
  }

  /**
   * Read and parse a project definition file
   */
  public async readProject(projectId: string): Promise<ProjectDefinition> {
    const filePath = this.getProjectFilePath(projectId);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Project file not found: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, "utf8");
    return this.parseMarkdownProject(content);
  }

  private parseMarkdownProject(content: string): ProjectDefinition {
    const adminSection = this.extractTomlSection(content, "## Admin");
    const tasksSection = this.extractTomlSection(content, "## Tasks");

    if (!adminSection) {
      throw new Error("Project file must contain an '## Admin' section");
    }

    if (!tasksSection) {
      throw new Error("Project file must contain a '## Tasks' section");
    }

    const adminData = toml.parse(adminSection) as Record<string, unknown>;
    const tasksData = toml.parse(tasksSection) as Record<string, unknown>;

    return {
      admin: this.parseAdminSection(adminData),
      tasks: this.parseTasksSection(tasksData),
    };
  }

  private extractTomlSection(
    content: string,
    sectionHeader: string,
  ): string | null {
    const lines = content.split("\n");
    let inSection = false;
    const sectionContent: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.trim() === sectionHeader) {
        inSection = true;
        continue;
      }

      if (inSection && line.trim().startsWith("##")) {
        break;
      }

      if (inSection && line.trim().startsWith("```toml")) {
        continue;
      }

      if (inSection && line.trim().startsWith("```")) {
        break;
      }

      if (inSection) {
        sectionContent.push(line);
      }
    }

    return sectionContent.length > 0 ? sectionContent.join("\n") : null;
  }

  private parseAdminSection(data: Record<string, unknown>): AdminSection {
    const startDate = this.parseDay(data.start_date as string);
    const person: Record<string, Person> = {};

    if (data.person && typeof data.person === "object") {
      for (const [personId, personData] of Object.entries(
        data.person as Record<string, unknown>,
      )) {
        const personInfo = personData as Record<string, unknown>;
        person[personId] = {
          availability: Array.isArray(personInfo.availability)
            ? personInfo.availability.map((avail: unknown) =>
                this.parseAvailability(avail as string),
              )
            : [],
        } as Person;
      }
    }

    return {
      start_date: startDate,
      person,
    };
  }

  private parseTasksSection(data: Record<string, unknown>): TasksSection {
    const tasks: TasksSection = {};

    for (const [taskId, taskData] of Object.entries(data)) {
      const task = taskData as Record<string, unknown>;
      tasks[taskId] = {
        summary: (task.summary as string) || "",
        description: (task.description as string) || "",
        estimate_days: {
          min:
            ((task.estimate_days as Record<string, unknown>)?.min as number) ||
            0,
          max:
            ((task.estimate_days as Record<string, unknown>)?.max as number) ||
            0,
          expected:
            ((task.estimate_days as Record<string, unknown>)
              ?.expected as number) || 0,
        },
        status: (task.status as TaskStatus) || "not-started",
        owners: Array.isArray(task.owners) ? (task.owners as string[]) : [],
        dependencies: Array.isArray(task.dependencies)
          ? (task.dependencies as string[])
          : [],
      };
    }

    return tasks;
  }

  private parseDay(dateStr: string): Day {
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
      throw new Error(`Invalid date format: ${dateStr}. Expected YYYY-MM-DD`);
    }

    return {
      year: parseInt(match[1]),
      month: parseInt(match[2]),
      day: parseInt(match[3]),
    };
  }

  private parseAvailability(availStr: string): PersonAvailability {
    const match = availStr.match(
      /^(\d{4}-\d{2}-\d{2}) to (\d{4}-\d{2}-\d{2}) at ([\d.]+) hours?$/,
    );
    if (!match) {
      throw new Error(
        `Invalid availability format: ${availStr}. Expected "YYYY-MM-DD to YYYY-MM-DD at # hours"`,
      );
    }

    return {
      startDate: this.parseDay(match[1]),
      endDate: this.parseDay(match[2]),
      hoursPerDay: parseFloat(match[3]),
    };
  }
}
