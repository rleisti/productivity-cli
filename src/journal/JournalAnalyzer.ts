import JournalDay from "./JournalDay";
import { ClientTimesheetAggregation, Day, Month } from "./types";
import { formatDay } from "./util";
import * as path from "node:path";
import * as fs from "node:fs";
import JournalDayRange from "./JournalDayRange";

type JournalAnalyzerConfiguration = {
  /** The base path of the journal files. */
  basePath: string;
};

/**
 * Analyzes journal files to report data for various scenarios such as per month, week, or day.
 */
export default class JournalAnalyzer {
  private readonly config: JournalAnalyzerConfiguration;

  constructor(configuration: JournalAnalyzerConfiguration) {
    this.config = configuration;
  }

  /**
   * Analyze a particular date, returning the detail task breakdown
   * for that day.
   *
   * @param day the day to analyze.
   */
  public async analyzeDay(day: Day): Promise<JournalDay> {
    const filePath = path.join(
      this.config.basePath,
      "" + day.year,
      `${formatDay(day)}.txt`,
    );

    const readPromise = new Promise((resolve) => {
      fs.readFile(filePath, "utf8", (err, data) => {
        if (!err) {
          resolve(data);
        } else {
          resolve("");
        }
      });
    });

    const content = (await readPromise) as string;
    return JournalDay.read(formatDay(day), content);
  }

  /**
   * Analyze a given month, returning an aggregation of all journal
   * days within the month.
   *
   * @param month the month to analyze.
   */
  public async analyzeMonth(
    month: Month,
  ): Promise<ClientTimesheetAggregation[]> {
    const journalDays = [];
    const currentDay = new Date(month.year, month.month - 1);
    while (currentDay.getMonth() === month.month - 1) {
      const journalDay = await this.analyzeDay({
        year: currentDay.getFullYear(),
        month: currentDay.getMonth() + 1,
        day: currentDay.getDate(),
      });
      journalDays.push(journalDay);
      currentDay.setDate(currentDay.getDate() + 1);
    }

    const journalDayRange = new JournalDayRange(journalDays);
    return journalDayRange.aggregate();
  }
}
