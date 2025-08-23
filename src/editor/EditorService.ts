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
      const editorProcess = this.config.processSpawner.spawn(
        this.config.editor,
        [expandedFilePath],
        {
          stdio: "inherit",
          shell: true,
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
}
