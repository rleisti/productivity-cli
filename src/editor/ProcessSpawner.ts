import {
  ChildProcess,
  SpawnOptions as NodeSpawnOptions,
} from "node:child_process";

export interface ProcessSpawner {
  spawn(
    command: string,
    args: string[],
    options: NodeSpawnOptions,
  ): ChildProcess;
}
