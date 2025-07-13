import {
  ActivityTimesheetEntry,
  ClientTimesheetEntry,
  JournalClientConfiguration,
  JournalDay,
  ProjectTimesheetEntry,
} from "./types";

export type JournalDayReaderConfiguration = {
  clients: JournalClientConfiguration[];
};

/**
 * Reads daily journal entries.
 */
export default class JournalDayReader {
  private readonly config: JournalDayReaderConfiguration;

  constructor(configuration: JournalDayReaderConfiguration) {
    this.config = configuration;
  }

  /**
   * Parse a daily journal entry to extract timesheet information./
   *
   * @param date the date of the journal entry, in format YYYY-MM-DD
   * @param content the daily journal content.
   */
  public read(date: string, content: string): JournalDay {
    const clients = [];
    const clientMap = new Map<string, ClientTimesheetEntry>();
    const projectMap = new Map<string, ProjectTimesheetEntry>();
    const activityMap = new Map<string, ActivityTimesheetEntry>();
    let lastClientConfig = undefined;
    let lastClient = undefined;
    let lastProject = undefined;
    let lastActivity = undefined;
    let clock = 0;

    for (const line of content.split("\n")) {
      const lineMatch = line.trim().match(JournalDayReader.timeEntryRegex);
      if (!lineMatch) {
        continue;
      }

      const timeStart = normalizeTime(lineMatch[1]);
      const classification = lineMatch[2];
      const note = lineMatch[3];

      const timeIncrement = timeStart - clock;
      clock = timeStart;

      if (lastClientConfig && lastClient) {
        lastClient.minutes += timeIncrement;

        if (lastProject) {
          lastProject.minutes += timeIncrement;
        }

        if (lastActivity) {
          lastActivity.minutes += timeIncrement;
          lastActivity.roundedMinutes = this.roundMinutes(
            lastClientConfig,
            lastActivity.minutes,
          );
        }
      }

      lastClient = undefined;
      lastProject = undefined;
      lastActivity = undefined;

      const classificationMatch = classification.match(
        JournalDayReader.classificationRegex,
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
                  const newClient = {
                    client: clientName,
                    minutes: 0,
                    roundedMinutes: 0,
                    projects: [],
                  };
                  clientMap.set(clientName, newClient);
                  clients.push(newClient);
                  return newClient;
                })();

              const newProject = {
                project: projectName,
                minutes: 0,
                roundedMinutes: 0,
                activities: [],
              };
              projectMap.set(`${clientName}:${projectName}`, newProject);
              client.projects.push(newProject);
              return newProject;
            })();

          const newActivity = {
            activity: activityName,
            minutes: 0,
            roundedMinutes: 0,
            notes: [note],
          };
          activityMap.set(classification, newActivity);
          project.activities.push(newActivity);
          return newActivity;
        })();

      if (activity.notes.indexOf(note) === -1) {
        activity.notes.push(note);
      }

      lastClientConfig = this.getClientConfig(clientName);
      lastClient = clientMap.get(clientName);
      lastProject = projectMap.get(`${clientName}:${projectName}`);
      lastActivity = activity;
    }

    clients.forEach((client) => {
      client.projects.forEach((project: ProjectTimesheetEntry) => {
        project.roundedMinutes = project.activities
          .map((activity) => activity.roundedMinutes)
          .reduce((a, b) => a + b, 0);
      });
      client.roundedMinutes = client.projects
        .map((project: ProjectTimesheetEntry) => project.roundedMinutes)
        .reduce((a, b) => a + b, 0);
    });

    return {
      clients,
      date,
      totalMinutes: clients
        .map((client) => client.minutes)
        .reduce((a, b) => a + b, 0),
    };
  }

  private getClientConfig(client: string): MaterializedClientConfiguration {
    const config = this.config.clients.find((c) => c.client === client);
    return {
      activityRoundingIncrement: config?.activityRoundingIncrement ?? 0,
      activityRoundingMethod: config?.activityRoundingMethod ?? "none",
    };
  }

  private roundMinutes(
    clientConfig: MaterializedClientConfiguration,
    minutes: number,
  ): number {
    switch (clientConfig.activityRoundingMethod) {
      case "none":
        return minutes;
      case "round":
        return (
          Math.round(minutes / clientConfig.activityRoundingIncrement) *
          clientConfig.activityRoundingIncrement
        );
      case "roundUp":
        return (
          Math.ceil(minutes / clientConfig.activityRoundingIncrement) *
          clientConfig.activityRoundingIncrement
        );
    }
  }

  private static timeEntryRegex = /^(\d{2}:\d{2})\s+([A-Za-z0-9_:-]+)\s*(.*)$/;
  private static classificationRegex = /^(.+):(.+):(.+)$/;
}

/** Normalize a time given in the format HH:MM to an absolute number of minutes since midnight. */
function normalizeTime(time: string): number {
  const parts = time.split(":");
  return +parts[0] * 60 + +parts[1];
}

type MaterializedClientConfiguration = {
  activityRoundingIncrement: number;
  activityRoundingMethod: "none" | "round" | "roundUp";
};
