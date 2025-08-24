import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { ProcessSpawner } from "./ProcessSpawner";

type EditorConfiguration = {
  editor: string;
  processSpawner: ProcessSpawner;
};

/**
 * A service for launching an external editor.
 */
export class EditorService {
  private readonly config: EditorConfiguration;

  constructor(config: EditorConfiguration) {
    this.config = config;
  }

  /**
   * Open a given file with an external editor.
   *
   * If the given file does not exist, it will be created prior to opening
   * in the editor.
   *
   * @param filePath the path to the file.
   */
  public async openFile(filePath: string): Promise<void> {
    const expandedFilePath = this.expandTildePath(filePath);
    const basePath = path.dirname(expandedFilePath);
    if (!fs.existsSync(basePath)) {
      fs.mkdirSync(basePath, { recursive: true });
    }

    if (!fs.existsSync(expandedFilePath)) {
      fs.writeFileSync(expandedFilePath, "");
    }

    return new Promise<void>((resolve, reject) => {
      const { editorCommand, args } = this.extractEditorArgs(
        this.config.editor,
      );
      const editorProcess = this.config.processSpawner.spawn(
        editorCommand,
        [...args, expandedFilePath],
        {
          stdio: "inherit",
        },
      );

      editorProcess.on("exit", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Editor exited with code ${code}`));
        }
      });

      editorProcess.on("error", (error) => {
        reject(error);
      });
    });
  }

  /**
   * Expand tilde (~) in file paths to the user's home directory.
   *
   * @param filePath the path that may contain a tilde
   * @returns the expanded path
   */
  private expandTildePath(filePath: string): string {
    if (filePath.startsWith("~")) {
      return path.join(os.homedir(), filePath.slice(1));
    }
    return filePath;
  }

  /**
   * Extract out the command portion and any additional arguments
   * from the editor command.
   */
  private extractEditorArgs(command: string): {
    editorCommand: string;
    args: string[];
  } {
    const parts: string[] = [];
    let current = "";
    let inQuotes = false;
    let quoteChar = "";

    for (let i = 0; i < command.length; i++) {
      const char = command[i];

      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = "";
      } else if (char === " " && !inQuotes) {
        if (current.trim()) {
          parts.push(current.trim());
          current = "";
        }
      } else {
        current += char;
      }
    }

    if (current.trim()) {
      parts.push(current.trim());
    }

    const editorCommand = parts[0] || "";
    const args = parts.slice(1);
    return { editorCommand, args };
  }
}
