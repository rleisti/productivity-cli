import { promises as fs } from "fs";
import { ProjectDefinition, TasksSection } from "./ProjectDefinition";

export interface ProjectVisualizationServiceConfiguration {
  /** Function to calculate task estimates using PERT formula */
  calculateTaskEstimate: (task: {
    estimate_days: { min: number; max: number; expected: number };
  }) => number;
  /** Function to find critical path through tasks */
  findCriticalPath: (tasks: TasksSection) => string[];
}

export class ProjectVisualizationService {
  private config: ProjectVisualizationServiceConfiguration;

  constructor(config: ProjectVisualizationServiceConfiguration) {
    this.config = config;
  }

  /**
   * Generate a project visualization and save it to a file
   */
  public async generateVisualization(
    project: ProjectDefinition,
    outputPath: string,
  ): Promise<void> {
    const mermaidDiagram = this.generateMermaidDiagram(project);

    try {
      // For now, save the Mermaid diagram source as a .mmd file
      // This can be used with Mermaid CLI or online tools to generate images
      const mermaidFilePath = outputPath.replace(/\.(png|svg)$/, ".mmd");
      await fs.writeFile(mermaidFilePath, mermaidDiagram);

      console.log(`Mermaid diagram saved to: ${mermaidFilePath}`);
      console.log("To generate PNG/SVG, you can:");
      console.log(
        `1. Use Mermaid CLI: npx @mermaid-js/mermaid-cli -i ${mermaidFilePath} -o ${outputPath}`,
      );
      console.log(
        "2. Visit https://mermaid.live/ and paste the diagram content",
      );
      console.log("3. Use VS Code with Mermaid extensions");
    } catch (error) {
      throw new Error(`Failed to generate visualization: ${error}`);
    }
  }

  /**
   * Generate Mermaid flowchart syntax for the project
   */
  private generateMermaidDiagram(project: ProjectDefinition): string {
    const tasks = project.tasks;
    const taskIds = Object.keys(tasks);

    if (taskIds.length === 0) {
      return "flowchart TD\n    Start[Project Start]\n    End[Project End]\n    Start --> End";
    }

    // Build the graph structure
    const vertices = this.buildVertexGraph(tasks);
    const criticalPath = this.config.findCriticalPath(tasks);

    let diagram = "flowchart TD\n";

    // Add vertices with their cumulative estimates
    for (const [vertexId, vertex] of Object.entries(vertices)) {
      const cumulativeEstimate = this.calculateCumulativeEstimate(
        vertex.incomingTasks,
        tasks,
        criticalPath,
      );
      diagram += `    ${vertexId}[${cumulativeEstimate.toFixed(1)} days]\n`;
    }

    // Add task edges between vertices
    for (const taskId of taskIds) {
      const task = tasks[taskId];
      const fromVertex = this.findSourceVertex(taskId, vertices);
      const toVertex = this.findTargetVertex(taskId, vertices);

      if (fromVertex && toVertex) {
        const taskLabel = this.escapeLabel(task.summary);
        const edgeStyle = criticalPath.includes(taskId) ? " ===>" : " -->";
        diagram += `    ${fromVertex}${edgeStyle}|${taskLabel}| ${toVertex}\n`;
      }
    }

    return diagram;
  }

  /**
   * Build a vertex-based graph structure from task dependencies
   */
  private buildVertexGraph(tasks: TasksSection): Record<string, Vertex> {
    const vertices: Record<string, Vertex> = {};
    const taskIds = Object.keys(tasks);

    // Create vertices for dependency convergence points
    let vertexCounter = 0;

    // Start vertex for tasks with no dependencies
    const startTasks = taskIds.filter(
      (taskId) => tasks[taskId].dependencies.length === 0,
    );
    if (startTasks.length > 0) {
      vertices["V0"] = {
        id: "V0",
        incomingTasks: [],
        outgoingTasks: startTasks,
      };
    }

    // Create vertices for each unique set of dependencies
    const dependencyGroups = new Map<string, string[]>();
    for (const taskId of taskIds) {
      const deps = tasks[taskId].dependencies.sort();
      const depsKey = deps.join(",");

      if (deps.length > 0) {
        if (!dependencyGroups.has(depsKey)) {
          dependencyGroups.set(depsKey, []);
        }
        dependencyGroups.get(depsKey)!.push(taskId);
      }
    }

    // Create vertices for dependency convergence
    for (const [depsKey, dependentTasks] of dependencyGroups) {
      const deps = depsKey.split(",").filter((d) => d);
      const vertexId = `V${++vertexCounter}`;
      vertices[vertexId] = {
        id: vertexId,
        incomingTasks: deps,
        outgoingTasks: dependentTasks,
      };
    }

    // End vertex for tasks with no dependents
    const endTasks = taskIds.filter((taskId) => {
      return !taskIds.some((otherId) =>
        tasks[otherId].dependencies.includes(taskId),
      );
    });
    if (endTasks.length > 0) {
      const endVertexId = `V${++vertexCounter}`;
      vertices[endVertexId] = {
        id: endVertexId,
        incomingTasks: endTasks,
        outgoingTasks: [],
      };
    }

    return vertices;
  }

  /**
   * Calculate cumulative estimate to reach a vertex via critical path
   */
  private calculateCumulativeEstimate(
    incomingTasks: string[],
    tasks: TasksSection,
    criticalPath: string[],
  ): number {
    if (incomingTasks.length === 0) {
      return 0;
    }

    // Find the maximum path estimate among incoming tasks
    let maxEstimate = 0;
    for (const taskId of incomingTasks) {
      if (criticalPath.includes(taskId)) {
        const taskIndex = criticalPath.indexOf(taskId);

        // Sum estimates of all tasks up to and including this task in critical path
        let pathEstimate = 0;
        for (let i = 0; i <= taskIndex; i++) {
          pathEstimate += this.config.calculateTaskEstimate(
            tasks[criticalPath[i]],
          );
        }

        maxEstimate = Math.max(maxEstimate, pathEstimate);
      }
    }

    return maxEstimate;
  }

  /**
   * Find the source vertex for a task (where its dependencies converge)
   */
  private findSourceVertex(
    taskId: string,
    vertices: Record<string, Vertex>,
  ): string | null {
    for (const vertex of Object.values(vertices)) {
      if (vertex.outgoingTasks.includes(taskId)) {
        return vertex.id;
      }
    }
    return null;
  }

  /**
   * Find the target vertex for a task (where it leads to)
   */
  private findTargetVertex(
    taskId: string,
    vertices: Record<string, Vertex>,
  ): string | null {
    for (const vertex of Object.values(vertices)) {
      if (vertex.incomingTasks.includes(taskId)) {
        return vertex.id;
      }
    }
    return null;
  }

  /**
   * Escape special characters in labels for Mermaid
   */
  private escapeLabel(label: string): string {
    return label.replace(/["|{}[\]]/g, "");
  }
}

interface Vertex {
  id: string;
  incomingTasks: string[];
  outgoingTasks: string[];
}
