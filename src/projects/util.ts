import { TaskEstimate, TasksSection } from "./ProjectDefinition";

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
