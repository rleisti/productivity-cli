import {
  ProjectFileReader,
  ProjectClientConfiguration,
} from "./ProjectFileReader";
import { ProjectAnalyzer } from "./ProjectAnalyzer";
import { ProjectSummary } from "./ProjectDefinition";
import { Day } from "../journal/types";
import { ProjectVisualizationService } from "./ProjectVisualizationService";
import { expandTildePath, formatDate } from "../util";
import fs from "node:fs";
import path from "node:path";

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
    this.visualizationService = new ProjectVisualizationService();
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

  /**
   * Initialize a new project file
   * @param clientId
   * @param projectId
   */
  public async initializeProject(
    clientId: string,
    projectId: string,
  ): Promise<void> {
    const clientConfig = this.findClientConfig(clientId);
    if (!clientConfig.projectFilePattern) {
      throw new Error(
        `Client '${clientId}' does not have a project_file_pattern configured`,
      );
    }

    const projectFileReader = new ProjectFileReader(clientConfig);
    const filePath = projectFileReader.getProjectFilePath(projectId);
    const expandedFilePath = expandTildePath(filePath);

    if (fs.existsSync(expandedFilePath)) {
      throw new Error(`Project file already exists: ${expandedFilePath}`);
    }

    const parentDir = path.dirname(expandedFilePath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    const sampleContent = generateSampleProjectContent(projectId);
    fs.writeFileSync(expandedFilePath, sampleContent);
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

function generateSampleProjectContent(projectId: string): string {
  const today = new Date();
  const startDate = formatDate(today);

  const endDate1 = new Date(today);
  endDate1.setMonth(endDate1.getMonth() + 2);
  const endDateString1 = formatDate(endDate1);

  const endDate2 = new Date(today);
  endDate2.setMonth(endDate2.getMonth() + 3);
  const endDateString2 = formatDate(endDate2);

  const projectTitle = projectId.charAt(0).toUpperCase() + projectId.slice(1);
  return `# ${projectTitle} Project

This is the ${projectId} project.

## Admin

\`\`\`toml
start_date = "${startDate}"

[person.alice]
availability = [
    "${startDate} to ${endDateString1} at 8 hours",
    "${endDateString1} to ${endDateString2} at 6 hours"
]

[person.bob]
availability = ["${startDate} to ${endDateString2} at 7 hours"]
\`\`\`

## Tasks

\`\`\`toml
[planning]
summary = "Project planning and requirements analysis"
description = "Define project scope, gather requirements, and create detailed project plan"
status = "not-started"
owners = ["alice"]
dependencies = []
estimate_days = { min = 2, max = 4, expected = 3 }

[design]
summary = "System design and architecture"
description = "Create system architecture, design interfaces, and establish technical specifications"
status = "not-started"
owners = ["alice"]
dependencies = ["planning"]
estimate_days = { min = 3, max = 6, expected = 4 }

[implementation]
summary = "Core implementation"
description = "Implement the main functionality according to the design specifications"
status = "not-started"
owners = ["bob"]
dependencies = ["design"]
estimate_days = { min = 8, max = 15, expected = 10 }

[testing]
summary = "Testing and quality assurance"
description = "Comprehensive testing including unit tests, integration tests, and user acceptance testing"
status = "not-started"
owners = ["alice", "bob"]
dependencies = ["implementation"]
estimate_days = { min = 3, max = 6, expected = 4 }

[deployment]
summary = "Deployment and launch"
description = "Deploy to production environment and monitor initial launch"
status = "not-started"
owners = ["bob"]
dependencies = ["testing"]
estimate_days = { min = 1, max = 3, expected = 2 }
\`\`\`
`;
}
