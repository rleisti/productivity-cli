import JournalAnalyzer, {
  JournalAnalyzerConfiguration,
} from "./JournalAnalyzer";
import JournalReporter, {
  JournalReporterConfiguration,
} from "./JournalReporter";
import { Day, JournalDay, Month, TimesheetReport } from "./types";

type JournalServiceConfiguration = {
  analyzer: JournalAnalyzerConfiguration;
  reporter: JournalReporterConfiguration;
};

/**
 * A service providing timesheet reporting from journal files.
 *
 */
export default class JournalService {
  private readonly analyzer: JournalAnalyzer;
  private readonly reporter: JournalReporter;

  constructor(configuration: JournalServiceConfiguration) {
    this.analyzer = new JournalAnalyzer(configuration.analyzer);
    this.reporter = new JournalReporter(configuration.reporter);
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
    const data = await this.analyzer.analyzeWeek(weekOffset);
    return this.reporter.report(data);
  }

  /**
   * Generate a report for a given month.
   *
   * @param month the month to report on.
   */
  public async reportMonth(month: Month): Promise<TimesheetReport> {
    const data = await this.analyzer.analyzeMonth(month);
    return this.reporter.report(data);
  }
}
