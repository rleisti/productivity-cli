import { promises as fs } from "fs";
import { SimulatedProject } from "./ProjectSimulation";
import { formatDay } from "../journal/util";

export class ProjectVisualizationService {
  /**
   * Generate a project visualization and save it to a file
   */
  public async generateVisualization(
    project: SimulatedProject,
    outputPath: string,
  ): Promise<void> {
    const mermaidDiagram = this.generateMermaidDiagram(project);

    try {
      await fs.writeFile(outputPath, mermaidDiagram);

      const imagePath = outputPath.replace(/\.mmd$/, ".png");
      console.log(`Mermaid diagram saved to: ${outputPath}`);
      console.log("To generate PNG/SVG, you can:");
      console.log(
        `1. Use Mermaid CLI: npx @mermaid-js/mermaid-cli -i ${outputPath} -o ${imagePath}`,
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
  public generateMermaidDiagram(simulation: SimulatedProject): string {
    if (simulation.checkpoints.length === 0) {
      return "flowchart TD\n    Start[Project Start]\n    End[Project End]\n    Start --> End";
    }

    let diagram = "flowchart TD\n";
    for (const checkpoint of simulation.checkpoints) {
      diagram += `    C${checkpoint.id}[${formatDay(checkpoint.day)}]\n`;
    }
    for (const checkpoint of simulation.checkpoints) {
      for (const execution of checkpoint.outgoing) {
        const taskLabelComponents: string[] = [];
        if (execution.taskId) {
          taskLabelComponents.push(this.escapeLabel(execution.taskId));
        }
        if (execution.personId) {
          taskLabelComponents.push(this.escapeLabel(execution.personId));
        }
        if (execution.float) {
          taskLabelComponents.push(`F:${execution.float.toFixed(0)}`);
        }
        if (execution.estimate) {
          taskLabelComponents.push(`E:${execution.estimate.toFixed(0)}`);
        }
        const taskLabel = taskLabelComponents.join(" ");
        let lineFormat = "";
        if (execution.taskId) {
          if (execution.float === 0) {
            lineFormat = `== ${taskLabel} ==>`;
          } else {
            lineFormat = `-- ${taskLabel} -->`;
          }
        } else if (taskLabel.length > 0) {
          lineFormat = `-. ${taskLabel} .->`;
        } else {
          lineFormat = `-.->`;
        }
        diagram += `    C${execution.from}${lineFormat}C${execution.to}\n`;
      }
    }

    return diagram;
  }

  /**
   * Escape special characters in labels for Mermaid
   */
  private escapeLabel(label: string): string {
    return label.replace(/["|{}[\]]/g, "");
  }
}
