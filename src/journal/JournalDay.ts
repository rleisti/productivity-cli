import {
  ActivityTimesheetEntry,
  ClientTimesheetEntry,
  ProjectTimesheetEntry,
} from "./types";

/**
 * Processor and data representation of a single day of journal entries.
 */
export default class JournalDay {
  private readonly date: string;
  private readonly clients: ClientTimesheetEntry[];

  private constructor(date: string, clients: ClientTimesheetEntry[]) {
    this.date = date;
    this.clients = clients;
  }

  /**
   * Parse a daily journal entry to extract timesheet information./
   *
   * @param date the date of the journal entry, in format YYYY-MM-DD
   * @param content the daily journal content.
   */
  public static read(date: string, content: string): JournalDay {
    const clients = [];
    const clientMap = new Map<string, ClientTimesheetEntry>();
    const projectMap = new Map<string, ProjectTimesheetEntry>();
    const activityMap = new Map<string, ActivityTimesheetEntry>();
    let lastActivity = undefined;
    let clock = 0;

    for (const line of content.split("\n")) {
      const lineMatch = line.trim().match(JournalDay.timeEntryRegex);
      if (!lineMatch) {
        continue;
      }

      const timeStart = normalizeTime(lineMatch[1]);
      const classification = lineMatch[2];
      const note = lineMatch[3];

      if (lastActivity) {
        lastActivity.minutes += timeStart - clock;
      }
      clock = timeStart;
      lastActivity = undefined;

      const classificationMatch = classification.match(
        JournalDay.classificationRegex,
      );
      if (!classificationMatch) {
        continue;
      }

      const clientName = classificationMatch[1];
      const projectName = classificationMatch[2];
      const activityName = classificationMatch[3];

      const activity =
        activityMap.get(classification) ||
        (() => {
          const project =
            projectMap.get(`${clientName}:${projectName}`) ||
            (() => {
              const client =
                clientMap.get(clientName) ||
                (() => {
                  const newClient = { client: clientName, projects: [] };
                  clientMap.set(clientName, newClient);
                  clients.push(newClient);
                  return newClient;
                })();

              const newProject = { project: projectName, activities: [] };
              projectMap.set(`${clientName}:${projectName}`, newProject);
              client.projects.push(newProject);
              return newProject;
            })();

          const newActivity = {
            activity: activityName,
            minutes: 0,
            notes: [note],
          };
          activityMap.set(classification, newActivity);
          project.activities.push(newActivity);
          return newActivity;
        })();

      if (activity.notes.indexOf(note) === -1) {
        activity.notes.push(note);
      }

      lastActivity = activity;
    }

    return new JournalDay(date, clients);
  }

  /**
   * Return the date of the journal entry, in the format YYYY-MM-DD
   */
  public getDate(): string {
    return this.date;
  }

  /**
   * Return the client timesheet entries that appeared in the timesheet entries for this day.
   */
  public getClients(): ClientTimesheetEntry[] {
    return this.clients;
  }

  private static timeEntryRegex = /^(\d{2}:\d{2})\s+([A-Za-z0-9:]+)\s*(.*)$/;
  private static classificationRegex = /^(.+):(.+):(.+)$/;
}

/** Normalize a time given in the format HH:MM to an absolute number of minutes since midnight. */
function normalizeTime(time: string): number {
  const parts = time.split(":");
  return +parts[0] * 60 + +parts[1];
}
