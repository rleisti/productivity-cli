import {
  ProjectFileReader,
  ProjectClientConfiguration,
} from "./ProjectFileReader";
import { ProjectAnalyzer } from "./ProjectAnalyzer";
import { ProjectSummary } from "./ProjectDefinition";
import { Day } from "../journal/types";

export type { ProjectClientConfiguration };

export interface ProjectServiceConfiguration {
  /** Work day classifier function */
  workDayClassifier: (day: Day) => boolean;
  /** Array of client configurations */
  clients: ProjectClientConfiguration[];
}

export class ProjectService {
  private config: ProjectServiceConfiguration;
  private analyzer: ProjectAnalyzer;

  constructor(config: ProjectServiceConfiguration) {
    this.config = config;
    this.analyzer = new ProjectAnalyzer(config.workDayClassifier);
  }

  /**
   * Generate a project summary report
   */
  public async generateProjectSummary(
    clientId: string,
    projectId: string,
  ): Promise<ProjectSummary> {
    const clientConfig = this.findClientConfig(clientId);
    const fileReader = new ProjectFileReader(clientConfig);

    const project = await fileReader.readProject(projectId);
    return this.analyzer.analyzeProject(project);
  }

  private findClientConfig(clientId: string): ProjectClientConfiguration {
    const clientConfig = this.config.clients.find((c) => c.client === clientId);
    if (!clientConfig) {
      throw new Error(`Client '${clientId}' not found in configuration`);
    }

    if (!clientConfig.projectFilePattern) {
      throw new Error(
        `Client '${clientId}' does not have a project_file_pattern configured`,
      );
    }

    return clientConfig;
  }
}
