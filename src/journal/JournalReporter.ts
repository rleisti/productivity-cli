import {
  JournalClientConfiguration,
  TimesheetAggregation,
  TimesheetReport,
} from "./types";

export type JournalReporterConfiguration = {
  clients: JournalClientConfiguration[];
};

/**
 * Generates reporting data based on timesheet aggregate data
 */
export default class JournalReporter {
  private readonly config: JournalReporterConfiguration;

  constructor(configuration: JournalReporterConfiguration) {
    this.config = configuration;
  }

  /**
   * Generate a report for a given aggregation of timesheet data.
   *
   * @param aggregation the aggregate data to report on.
   */
  public report(aggregation: TimesheetAggregation): TimesheetReport {
    const clients = aggregation.clients.map((client) => {
      const targetHoursPerDay = this.getClientTargetHoursPerDay(client.client);
      const targetMinutes =
        targetHoursPerDay * 60 * aggregation.workDaysElapsed;
      const periodTargetMinutes =
        targetHoursPerDay * 60 * aggregation.workDaysInPeriod;

      const projects = client.projects.map((project) => {
        return {
          project: project.project,
          actualMinutes: project.minutes,
          roundedMinutes: project.roundedMinutes,
        };
      });

      return {
        client: client.client,
        actualMinutes: client.minutes,
        roundedMinutes: client.roundedMinutes,
        targetMinutes,
        periodTargetMinutes,
        projects,
      };
    });

    return { range: aggregation.range, clients };
  }

  private getClientTargetHoursPerDay(client: string): number {
    const config = this.config.clients.find((c) => c.client === client);
    return config?.targetHoursPerDay ?? 8;
  }
}
