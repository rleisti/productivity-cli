import JournalDay from "./JournalDay";
import {
  ClientTimesheetAggregation,
  ProjectTimesheetAggregation,
} from "./types";

/**
 * A collection of days for data aggregation.
 */
export default class JournalDayRange {
  private readonly days: JournalDay[];

  constructor(days: JournalDay[]) {
    this.days = days;
  }

  /**
   * Compute an aggregate data set over the days within this day range.
   */
  public aggregate(): ClientTimesheetAggregation[] {
    const clients = [];
    const clientMap = new Map<string, ClientTimesheetAggregation>();
    const projectMap = new Map<string, ProjectTimesheetAggregation>();

    for (const day of this.days) {
      for (const dayClient of day.getClients()) {
        const client =
          clientMap.get(dayClient.client) ||
          (() => {
            const newClient = {
              client: dayClient.client,
              minutes: 0,
              minuteIncrements: [],
              projects: [],
            };
            clientMap.set(dayClient.client, newClient);
            clients.push(newClient);
            return newClient;
          })();

        for (const dayProject of dayClient.projects) {
          const project =
            projectMap.get(`${dayClient.client}:${dayProject.project}`) ||
            (() => {
              const newProject = {
                project: dayProject.project,
                minutes: 0,
                minuteIncrements: [],
              };
              projectMap.set(
                `${dayClient.client}:${dayProject.project}`,
                newProject,
              );
              client.projects.push(newProject);
              return newProject;
            })();

          for (const activity of dayProject.activities) {
            project.minutes += activity.minutes;
            project.minuteIncrements.push(activity.minutes);
            client.minutes += activity.minutes;
            client.minuteIncrements.push(activity.minutes);
          }
        }
      }
    }

    return clients;
  }
}
