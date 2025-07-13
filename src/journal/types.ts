export type JournalClientConfiguration = {
  /** The client identifier. */
  client: string;

  /** The nominal working hours target per day. Defaults to 8. */
  targetHoursPerDay?: number;

  /** The number of minutes to round increments to. Defaults to 0. */
  activityRoundingIncrement?: number;

  /** The method to use for rounding activity minutes. Defaults to 'none'. */
  activityRoundingMethod?: "none" | "round" | "roundUp";
};

export type JournalDay = {
  clients: ClientTimesheetEntry[];
  date: string;
  totalMinutes: number;
};

export type ClientTimesheetEntry = {
  client: string;
  minutes: number;
  roundedMinutes: number;
  projects: ProjectTimesheetEntry[];
};

export type ProjectTimesheetEntry = {
  project: string;
  minutes: number;
  roundedMinutes: number;
  activities: ActivityTimesheetEntry[];
};

export type ActivityTimesheetEntry = {
  activity: string;
  minutes: number;
  roundedMinutes: number;
  notes: string[];
};

export type ClientTimesheetAggregation = {
  client: string;
  minutes: number;
  roundedMinutes: number;
  projects: ProjectTimesheetAggregation[];
};

export type ProjectTimesheetAggregation = {
  project: string;
  minutes: number;
  roundedMinutes: number;
};

export type TimesheetReport = {
  /** A description of the reported date range. */
  range: string;

  clients: ClientTimesheetReport[];
};

export type ClientTimesheetReport = {
  /** The client identifier. */
  client: string;

  /** The actual number of minutes spent. */
  actualMinutes: number;

  /** The rounded number of minutes spent. */
  roundedMinutes: number;

  /** The target number of minutes that should have been spent so far. */
  targetMinutes: number;

  /** The target number of minutes for the entire reporting period. */
  periodTargetMinutes: number;

  /** Breakdown by project. */
  projects: ProjectTimesheetReport[];
};

export type ProjectTimesheetReport = {
  /** The project identifier. */
  project: string;

  /** The actual number of minutes spent. */
  actualMinutes: number;

  /** The rounded number of minutes spent. */
  roundedMinutes: number;
};

export type Day = {
  year: number;
  month: number;
  day: number;
};

export type Month = {
  year: number;
  month: number;
};
