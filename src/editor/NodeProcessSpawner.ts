import { spawn, ChildProcess, SpawnOptions } from "node:child_process";
import { ProcessSpawner } from "./ProcessSpawner";

export class NodeProcessSpawner implements ProcessSpawner {
  spawn(command: string, args: string[], options: SpawnOptions): ChildProcess {
    return spawn(command, args, options);
  }
}
