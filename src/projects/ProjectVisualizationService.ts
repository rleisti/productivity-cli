import { promises as fs } from "fs";
import { SimulatedProject } from "./ProjectSimulation";
import { formatDay } from "../journal/util";
import path from "node:path";
import { spawn } from "node:child_process";

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

      const imagePath = outputPath.replace(/\.mmd$/, ".svg");
      await this.renderMermaidDiagram(outputPath, imagePath);

      console.log(`Mermaid diagram saved to: ${outputPath}`);
      console.log(`PNG diagram saved to: ${imagePath}`);
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

  private async renderMermaidDiagram(diagramPath: string, imagePath: string) {
    const mermaidCliPath =
      process.platform === "win32"
        ? path.resolve(process.cwd(), "node_modules", ".bin", "mmdc.cmd")
        : path.resolve(process.cwd(), "node_modules", ".bin", "mmdc");
    const mermaidFunc = (cmd: string, args: string[]) =>
      new Promise<void>((resolve, reject) => {
        const childProcess = spawn(cmd, args, {
          stdio: "inherit",
          shell: false,
        });
        childProcess.on("error", reject);
        childProcess.on("exit", (exitCode) => {
          if (exitCode === 0) {
            resolve();
          } else {
            reject(new Error(`Mermaid CLI exited with code ${exitCode}`));
          }
        });
      });
    try {
      await fs.access(mermaidCliPath);
      await mermaidFunc(mermaidCliPath, ["-i", diagramPath, "-o", imagePath]);
    } catch {
      await mermaidFunc("npx", [
        "-y",
        "@mermaid-js/mermaid-cli",
        "-i",
        diagramPath,
        "-o",
        imagePath,
      ]);
    }
  }
}
