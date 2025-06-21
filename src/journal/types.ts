export type ClientTimesheetEntry = {
  client: string;
  projects: ProjectTimesheetEntry[];
};

export type ProjectTimesheetEntry = {
  project: string;
  activities: ActivityTimesheetEntry[];
};

export type ActivityTimesheetEntry = {
  activity: string;
  minutes: number;
  notes: string[];
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

export type Day = {
  year: number;
  month: number;
  day: number;
};

export type Month = {
  year: number;
  month: number;
};
