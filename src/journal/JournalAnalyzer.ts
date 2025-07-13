import {
  Day,
  JournalClientConfiguration,
  JournalDay,
  Month,
  TimesheetAggregation,
} from "./types";
import {
  dateToDay,
  formatDay,
  formatDayRange,
  formatMonth,
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
  public async analyzeMonth(month: Month): Promise<TimesheetAggregation> {
    const startDate = new Date(month.year, month.month - 1);
    return this.analyzeDateRange(
      formatMonth(month),
      startDate,
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
  ): Promise<TimesheetAggregation> {
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
      (date) =>
        date.getDate() == startDate.getDate() || date.getDay() !== startOfWeek,
    );
  }

  private async analyzeDateRange(
    range: string,
    startDate: Date,
    condition: (date: Date) => boolean,
  ): Promise<TimesheetAggregation> {
    const journalDays = [];
    const elapsedBenchmarkDate = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      new Date().getDate() + 1,
    ).getTime();
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
        if (currentDate.getTime() < elapsedBenchmarkDate) {
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
    return {
      range,
      clients: journalDayRange.aggregate(),
      workDaysInPeriod: workDayCount,
      workDaysElapsed: workDayElapsedCount,
    };
  }
}
