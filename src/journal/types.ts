export type ClientTimesheetEntry = {
  client: string;
  minutes: number;
  projects: ProjectTimesheetEntry[];
};

export type ProjectTimesheetEntry = {
  project: string;
  minutes: number;
  activities: ActivityTimesheetEntry[];
};

export type ActivityTimesheetEntry = {
  activity: string;
  minutes: number;
  notes: string[];
};

export type TimesheetAggregation = {
  range: string;
  clients: ClientTimesheetAggregation[];
  workDaysInPeriod: number;
  workDaysElapsed: number;
};

export type ClientTimesheetAggregation = {
  client: string;
  minutes: number;
  minuteIncrements: number[];
  projects: ProjectTimesheetAggregation[];
};

export type ProjectTimesheetAggregation = {
  project: string;
  minutes: number;
  minuteIncrements: number[];
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
