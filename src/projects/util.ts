import { TaskEstimate, TasksSection } from "./ProjectDefinition";

export function findCriticalPath(
  tasks: TasksSection,
  startTask?: string,
): string[] {
  const taskIds = Object.keys(tasks);
  const visited = new Set<string>();
  const paths: string[][] = [];

  // Find all possible paths from start to end
  if (startTask) {
    findAllPaths(startTask, tasks, visited, [], paths);
  } else {
    for (const taskId of taskIds) {
      if (isStartTask(taskId, tasks)) {
        findAllPaths(taskId, tasks, visited, [], paths);
      }
    }
  }

  // Find the path with the longest total estimate
  let criticalPath: string[] = [];
  let maxEstimate = 0;

  for (const path of paths) {
    const pathEstimate = calculateTotalEstimate(path, tasks);
    if (pathEstimate > maxEstimate) {
      maxEstimate = pathEstimate;
      criticalPath = path;
    }
  }

  return criticalPath;
}

function isStartTask(taskId: string, tasks: TasksSection): boolean {
  return tasks[taskId].dependencies.length === 0;
}

function findAllPaths(
  currentTask: string,
  tasks: TasksSection,
  visited: Set<string>,
  currentPath: string[],
  allPaths: string[][],
): void {
  if (visited.has(currentTask)) {
    return; // Avoid cycles
  }

  visited.add(currentTask);
  currentPath.push(currentTask);

  const dependents = findDependents(currentTask, tasks);
  if (dependents.length === 0) {
    // This is an end task, save the path
    allPaths.push([...currentPath]);
  } else {
    for (const dependent of dependents) {
      findAllPaths(
        dependent,
        tasks,
        new Set(visited),
        [...currentPath],
        allPaths,
      );
    }
  }

  visited.delete(currentTask);
  currentPath.pop();
}

function findDependents(taskId: string, tasks: TasksSection): string[] {
  return Object.keys(tasks).filter((id) =>
    tasks[id].dependencies.includes(taskId),
  );
}

/** Calculate an overall estimate using the PERT formula */
export function calculateTaskEstimate(taskEstimate: TaskEstimate): number {
  return (taskEstimate.min + taskEstimate.max + 4 * taskEstimate.expected) / 6;
}

export function calculateTotalEstimate(
  taskIds: string[],
  tasks: TasksSection,
): number {
  return taskIds.reduce((total, taskId) => {
    const task = tasks[taskId];
    if (!task) return total;
    return total + calculateTaskEstimate(task.estimate_days);
  }, 0);
}
