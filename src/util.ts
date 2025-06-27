import fs from "node:fs";

export async function readOptionalFile(path: string): Promise<string> {
  const readPromise = new Promise((resolve) => {
    fs.readFile(path, "utf8", (err, data) => {
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
