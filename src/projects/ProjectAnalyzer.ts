import {
  ProjectDefinition,
  ProjectSummary,
  ProjectStatus,
  TasksSection,
} from "./ProjectDefinition";
import { Day } from "../journal/types";
import { calculateTotalEstimate, findCriticalPath } from "./util";

export class ProjectAnalyzer {
  private readonly workDayClassifier: (day: Day) => boolean;

  constructor(workDayClassifier: (day: Day) => boolean) {
    this.workDayClassifier = workDayClassifier;
  }

  /**
   * Analyze a project and generate a summary report
   */
  public analyzeProject(project: ProjectDefinition): ProjectSummary {
    const status = this.calculateProjectStatus(project.tasks);
    const criticalPath = findCriticalPath(project.tasks);
    const totalEstimatedDays = calculateTotalEstimate(
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
    const totalEstimate = calculateTotalEstimate(Object.keys(tasks), tasks);
    const completedEstimate = calculateTotalEstimate(
      Object.keys(tasks).filter((id) => tasks[id].status === "complete"),
      tasks,
    );

    if (totalEstimate === 0) {
      return 0;
    }

    return Math.round((completedEstimate / totalEstimate) * 100);
  }
}
