import { TimesheetAggregation, TimesheetReport } from "./types";

type JournalReporterConfiguration = {
  clients: JournalReporterClientConfiguration[];
};

type JournalReporterClientConfiguration = {
  /** The client identifier. */
  client: string;

  /** The nominal working hours target per day. Defaults to 8. */
  targetHoursPerDay?: number;

  /** The number of minutes to round increments to. Defaults to 0. */
  activityRoundingIncrement?: number;

  /** The method to use for rounding activity minutes. Defaults to 'none'. */
  activityRoundingMethod?: "none" | "round" | "roundUp";
};

type MaterializedClientConfiguration = {
  targetHoursPerDay: number;
  activityRoundingIncrement: number;
  activityRoundingMethod: "none" | "round" | "roundUp";
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
      const clientConfig = this.getClientConfig(client.client);
      const targetHoursPerDay = clientConfig.targetHoursPerDay;
      const targetMinutes =
        targetHoursPerDay * 60 * aggregation.workDaysElapsed;
      const periodTargetMinutes =
        targetHoursPerDay * 60 * aggregation.workDaysInPeriod;
      const roundedMinutes = client.minuteIncrements
        .map((minutes) => this.roundMinutes(clientConfig, minutes))
        .reduce((a, b) => a + b, 0);

      const projects = client.projects.map((project) => {
        return {
          project: project.project,
          actualMinutes: project.minutes,
          roundedMinutes: project.minuteIncrements
            .map((minutes) => this.roundMinutes(clientConfig, minutes))
            .reduce((a, b) => a + b, 0),
        };
      });

      return {
        client: client.client,
        actualMinutes: client.minutes,
        roundedMinutes,
        targetMinutes,
        periodTargetMinutes,
        projects,
      };
    });

    return { clients };
  }

  private getClientConfig(client: string): MaterializedClientConfiguration {
    const config = this.config.clients.find((c) => c.client === client);
    return {
      targetHoursPerDay: config?.targetHoursPerDay ?? 8,
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
}
