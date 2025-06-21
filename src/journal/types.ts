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
