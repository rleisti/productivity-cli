import { Day } from "../journal/types";

export type ProjectStatus = "not-started" | "in-progress" | "complete";
export type TaskStatus = "not-started" | "in-progress" | "complete";

export interface PersonAvailability {
  /** Start date of availability period in YYYY-MM-DD format */
  startDate: Day;
  /** End date of availability period in YYYY-MM-DD format */
  endDate: Day;
  /** Hours per day the person is available for this project */
  hoursPerDay: number;
}

export interface Person {
  /** Array of availability periods for this person */
  availability: PersonAvailability[];
}

export interface TaskEstimate {
  /** Minimum number of days to complete the task */
  min: number;
  /** Maximum number of days to complete the task */
  max: number;
  /** Expected number of days to complete the task */
  expected: number;
}

export interface Task {
  /** Short description of the task */
  summary: string;
  /** Full task description */
  description: string;
  /** Task effort estimate */
  estimate_days: TaskEstimate;
  /** Current status of the task */
  status: TaskStatus;
  /** Array of person identifiers responsible for completing the task */
  owners: string[];
  /** Array of task identifiers that must be completed before this task can start */
  dependencies: string[];
}

export interface AdminSection {
  /** Project start date in YYYY-MM-DD format */
  start_date: Day;
  /** Map of person identifiers to person properties */
  person: Record<string, Person>;
}

export interface TasksSection {
  /** Map of task identifiers to task properties */
  [taskId: string]: Task;
}

export interface ProjectDefinition {
  /** Administrative information about the project */
  admin: AdminSection;
  /** Work breakdown structure for the project */
  tasks: TasksSection;
}

export interface ProjectSummary {
  /** Overall project status */
  status: ProjectStatus;
  /** Total estimated days for the project */
  totalEstimatedDays: number;
  /** Estimated project completion date */
  estimatedCompletionDate: Day;
  /** Project completion percentage */
  completionPercentage: number;
}
