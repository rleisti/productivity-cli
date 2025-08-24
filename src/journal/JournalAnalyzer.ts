import {
  Day,
  JournalClientConfiguration,
  JournalDay,
  Month,
  TimesheetReport,
} from "./types";
import {
  dateToDay,
  formatDay,
  formatDayRange,
  formatMonth,
  getJournalFilePath,
  loadJournalFile,
} from "./util";
import JournalDayRange from "./JournalDayRange";
import JournalDayReader from "./JournalDayReader";

export type JournalAnalyzerConfiguration = {
  /** The base path of the journal files. */
  basePath: string;

  /** The beginning of the work week. 0 represents Sunday. The default value is Saturday. */
  startOfWeek?: number;

  /** A classification system to determine which days are considered working days. */
  workDayClassifier: (day: Day) => boolean;

  /** Client-specific business rules. */
  clients: JournalClientConfiguration[];
};

/**
 * Analyzes journal files to report data for various scenarios such as per month, week, or day.
 */
export default class JournalAnalyzer {
  private readonly config: JournalAnalyzerConfiguration;
  private readonly reader: JournalDayReader;

  constructor(configuration: JournalAnalyzerConfiguration) {
    this.config = configuration;
    this.reader = new JournalDayReader({
      clients: configuration.clients,
    });
  }

  /**
   * Analyze a particular date, returning the detail task breakdown
   * for that day.
   *
   * @param day the day to analyze.
   */
  public async analyzeDay(day: Day): Promise<JournalDay> {
    const content = await loadJournalFile(this.config.basePath, day);
    return this.reader.read(formatDay(day), content);
  }

  /**
   * Analyze a given month, returning an aggregation of all journal
   * days within the month.
   *
   * @param month the month to analyze.
   */
  public async analyzeMonth(month: Month): Promise<TimesheetReport> {
    const startDate = new Date(month.year, month.month - 1);
    return this.analyzeDateRange(
      formatMonth(month),
      startDate,
      this.deriveElapsedBenchmarkTimestamp(),
      (date) => date.getMonth() === month.month - 1,
    );
  }

  /**
   * Analyze a given week.
   *
   * @param weekOffset Identifies the week to analyze relative to the current week.
   *                   A value of 0 analyzes the current week, while a value of -1 analyzes last week and so forth.
   * @param relativeTo A day to use when determining the week to process, in conjunction with the week offset.
   *                   Defaults to today's date if no value is provided.
   */
  public async analyzeWeek(
    weekOffset: number = 0,
    relativeTo?: Day,
  ): Promise<TimesheetReport> {
    const relativeToDay = relativeTo || {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      day: new Date().getDate(),
    };
    const relativeToDate = new Date(
      relativeToDay.year,
      relativeToDay.month - 1,
      relativeToDay.day + weekOffset * 7,
    );
    const startOfWeek = this.config.startOfWeek ?? 6;
    const startDate = new Date(
      relativeToDate.getFullYear(),
      relativeToDate.getMonth(),
      relativeToDate.getDate() -
        ((relativeToDate.getDay() - startOfWeek + 7) % 7),
    );
    return this.analyzeDateRange(
      formatDayRange(dateToDay(startDate), 6),
      startDate,
      this.deriveElapsedBenchmarkTimestamp(relativeTo),
      (date) =>
        date.getDate() == startDate.getDate() || date.getDay() !== startOfWeek,
    );
  }

  /**
   * Return the journal file path for a given day
   */
  public getJournalFilePath(day: Day): string {
    return getJournalFilePath(this.config.basePath, day);
  }

  /**
   * Given a date representation the 'current day', derive a timestamp
   * used to compare against a working day to determine target working hours
   * remaining.
   * @param day the reference day.
   * @private
   */
  private deriveElapsedBenchmarkTimestamp(day?: Day): number {
    const dayDate = day
      ? new Date(day.year, day.month - 1, day.day + 1)
      : new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          new Date().getDate() + 1,
        );
    return dayDate.getTime();
  }

  private async analyzeDateRange(
    range: string,
    startDate: Date,
    elapsedBenchmarkTimestamp: number,
    condition: (date: Date) => boolean,
  ): Promise<TimesheetReport> {
    const journalDays = [];
    let currentDate = startDate;
    let workDayCount = 0;
    let workDayElapsedCount = 0;
    while (condition(currentDate)) {
      const day = {
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1,
        day: currentDate.getDate(),
      };
      const journalDay = await this.analyzeDay(day);
      journalDays.push(journalDay);

      if (this.config.workDayClassifier(day)) {
        workDayCount++;
        if (currentDate.getTime() < elapsedBenchmarkTimestamp) {
          workDayElapsedCount++;
        }
      }

      currentDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate() + 1,
      );
    }

    const journalDayRange = new JournalDayRange(journalDays);
    const aggregatedClients = journalDayRange.aggregate();
    const reportClients = aggregatedClients.map((client) => {
      const targetHoursPerDay = this.getClientTargetHoursPerDay(client.client);
      return {
        client: client.client,
        actualMinutes: client.minutes,
        roundedMinutes: client.roundedMinutes,
        targetMinutes: targetHoursPerDay * 60 * workDayElapsedCount,
        periodTargetMinutes: targetHoursPerDay * 60 * workDayCount,
        projects: client.projects.map((project) => ({
          project: project.project,
          actualMinutes: project.minutes,
          roundedMinutes: project.roundedMinutes,
        })),
      };
    });

    return {
      range,
      clients: reportClients,
    };
  }

  private getClientTargetHoursPerDay(client: string): number {
    const config = this.config.clients.find((c) => c.client === client);
    return config?.targetHoursPerDay ?? 8;
  }
}
