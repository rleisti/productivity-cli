import JournalAnalyzer, {
  JournalAnalyzerConfiguration,
} from "./JournalAnalyzer";
import { Day, JournalDay, Month, TimesheetReport } from "./types";

type JournalServiceConfiguration = JournalAnalyzerConfiguration;

/**
 * A service providing timesheet reporting from journal files.
 *
 */
export default class JournalService {
  private readonly analyzer: JournalAnalyzer;

  constructor(configuration: JournalServiceConfiguration) {
    this.analyzer = new JournalAnalyzer(configuration);
  }

  /**
   * Generate a detailed activity breakdown for a given day.
   *
   * @param day the day to report on.
   */
  public async reportDay(day: Day): Promise<JournalDay> {
    return this.analyzer.analyzeDay(day);
  }

  /**
   * Generate a report for a given week.
   *
   * @param weekOffset the week relative to the current week to report on.
   *                   A value of 0 indicates the current week; a value of
   *                   -1 indicates last week, and so on.
   */
  public async reportWeek(weekOffset?: number): Promise<TimesheetReport> {
    return await this.analyzer.analyzeWeek(weekOffset);
  }

  /**
   * Generate a report for a given month.
   *
   * @param month the month to report on.
   */
  public async reportMonth(month: Month): Promise<TimesheetReport> {
    return await this.analyzer.analyzeMonth(month);
  }
}
