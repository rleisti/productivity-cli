import {
  ProjectDefinition,
  ProjectSummary,
  ProjectStatus,
  TasksSection,
} from "./ProjectDefinition";
import { Day } from "../journal/types";

export class ProjectAnalyzer {
  private workDayClassifier: (day: Day) => boolean;

  constructor(workDayClassifier: (day: Day) => boolean) {
    this.workDayClassifier = workDayClassifier;
  }

  /**
   * Analyze a project and generate a summary report
   */
  public analyzeProject(project: ProjectDefinition): ProjectSummary {
    const status = this.calculateProjectStatus(project.tasks);
    const criticalPath = this.findCriticalPath(project.tasks);
    const totalEstimatedDays = this.calculateTotalEstimate(
      criticalPath,
      project.tasks,
    );
    const estimatedCompletionDate = this.calculateCompletionDate(
      project.admin.start_date,
      totalEstimatedDays,
    );
    const completionPercentage = this.calculateCompletionPercentage(
      project.tasks,
    );

    return {
      status,
      totalEstimatedDays,
      estimatedCompletionDate,
      completionPercentage,
    };
  }

  private calculateProjectStatus(tasks: TasksSection): ProjectStatus {
    const taskList = Object.values(tasks);

    if (taskList.length === 0) {
      return "not-started";
    }

    const allNotStarted = taskList.every(
      (task) => task.status === "not-started",
    );
    if (allNotStarted) {
      return "not-started";
    }

    const allComplete = taskList.every((task) => task.status === "complete");
    if (allComplete) {
      return "complete";
    }

    return "in-progress";
  }

  private findCriticalPath(tasks: TasksSection): string[] {
    const taskIds = Object.keys(tasks);
    const visited = new Set<string>();
    const paths: string[][] = [];

    // Find all possible paths from start to end
    for (const taskId of taskIds) {
      if (this.isStartTask(taskId, tasks)) {
        const path: string[] = [];
        this.findAllPaths(taskId, tasks, visited, path, paths);
      }
    }

    // Find the path with the longest total estimate
    let criticalPath: string[] = [];
    let maxEstimate = 0;

    for (const path of paths) {
      const pathEstimate = this.calculateTotalEstimate(path, tasks);
      if (pathEstimate > maxEstimate) {
        maxEstimate = pathEstimate;
        criticalPath = path;
      }
    }

    return criticalPath;
  }

  private isStartTask(taskId: string, tasks: TasksSection): boolean {
    return tasks[taskId].dependencies.length === 0;
  }

  private findAllPaths(
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

    const dependents = this.findDependents(currentTask, tasks);
    if (dependents.length === 0) {
      // This is an end task, save the path
      allPaths.push([...currentPath]);
    } else {
      for (const dependent of dependents) {
        this.findAllPaths(
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

  private findDependents(taskId: string, tasks: TasksSection): string[] {
    return Object.keys(tasks).filter((id) =>
      tasks[id].dependencies.includes(taskId),
    );
  }

  private calculateTotalEstimate(
    taskIds: string[],
    tasks: TasksSection,
  ): number {
    return taskIds.reduce((total, taskId) => {
      const task = tasks[taskId];
      if (!task) return total;

      // Use PERT formula: (min + max + 4 * expected) / 6
      const estimate =
        (task.estimate_days.min +
          task.estimate_days.max +
          4 * task.estimate_days.expected) /
        6;

      return total + estimate;
    }, 0);
  }

  private calculateCompletionDate(startDate: Day, estimatedDays: number): Day {
    const currentDate = new Date(
      startDate.year,
      startDate.month - 1,
      startDate.day,
    );
    let remainingDays = Math.ceil(estimatedDays);

    while (remainingDays > 0) {
      currentDate.setDate(currentDate.getDate() + 1);

      const dayToCheck: Day = {
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1,
        day: currentDate.getDate(),
      };

      if (this.workDayClassifier(dayToCheck)) {
        remainingDays--;
      }
    }

    return {
      year: currentDate.getFullYear(),
      month: currentDate.getMonth() + 1,
      day: currentDate.getDate(),
    };
  }

  private calculateCompletionPercentage(tasks: TasksSection): number {
    const taskList = Object.values(tasks);

    if (taskList.length === 0) {
      return 0;
    }

    // Calculate based on task estimates, not count
    const totalEstimate = this.calculateTotalEstimate(
      Object.keys(tasks),
      tasks,
    );
    const completedEstimate = this.calculateTotalEstimate(
      Object.keys(tasks).filter((id) => tasks[id].status === "complete"),
      tasks,
    );

    if (totalEstimate === 0) {
      return 0;
    }

    return Math.round((completedEstimate / totalEstimate) * 100);
  }
}
