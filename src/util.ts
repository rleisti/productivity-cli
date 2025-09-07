import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * Expand tilde (~) in file paths to the user's home directory.
 *
 * @param filePath the path that may contain a tilde
 * @returns the expanded path
 */
export function expandTildePath(filePath: string): string {
  if (filePath.startsWith("~")) {
    return path.join(os.homedir(), filePath.slice(1));
  }
  return filePath;
}

export async function readOptionalFile(path: string): Promise<string> {
  const readPromise = new Promise((resolve) => {
    fs.readFile(expandTildePath(path), "utf8", (err, data) => {
      if (!err) {
        resolve(data);
      } else {
        resolve("");
      }
    });
  });

  return (await readPromise) as string;
}

export function zeroPad(value: number, length: number) {
  let result = "" + value;
  while (result.length < length) {
    result = "0" + result;
  }
  return result;
}

export function formatDate(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}
