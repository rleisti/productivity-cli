import {
  ProjectFileReader,
  ProjectClientConfiguration,
} from "./ProjectFileReader";
import { ProjectAnalyzer } from "./ProjectAnalyzer";
import { ProjectSummary } from "./ProjectDefinition";
import { Day } from "../journal/types";
import { ProjectVisualizationService } from "./ProjectVisualizationService";

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
  private visualizationService: ProjectVisualizationService;

  constructor(config: ProjectServiceConfiguration) {
    this.config = config;
    this.analyzer = new ProjectAnalyzer(config.workDayClassifier);
    this.visualizationService = new ProjectVisualizationService({
      calculateTaskEstimate: (task) => {
        // Use PERT formula: (min + max + 4 * expected) / 6
        return (
          (task.estimate_days.min +
            task.estimate_days.max +
            4 * task.estimate_days.expected) /
          6
        );
      },
      findCriticalPath: (tasks) => {
        return this.analyzer.findCriticalPath(tasks);
      },
    });
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

  /**
   * Generate a project visualization
   */
  public async generateProjectVisualization(
    clientId: string,
    projectId: string,
    outputPath: string,
  ): Promise<void> {
    const clientConfig = this.findClientConfig(clientId);
    const fileReader = new ProjectFileReader(clientConfig);

    const project = await fileReader.readProject(projectId);
    await this.visualizationService.generateVisualization(project, outputPath);
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
