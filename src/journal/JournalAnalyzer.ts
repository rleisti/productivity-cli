import JournalDay from "./JournalDay";
import { ClientTimesheetAggregation, Day, Month } from "./types";
import { formatDay } from "./util";
import * as path from "node:path";
import * as fs from "node:fs";
import JournalDayRange from "./JournalDayRange";

type JournalAnalyzerConfiguration = {
  /** The base path of the journal files. */
  basePath: string;

  /** The beginning of the work week. 0 represents Sunday. The default value is Saturday. */
  startOfWeek?: number;
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
    const startDate = new Date(month.year, month.month - 1);
    return this.analyzeDateRange(
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
  ): Promise<ClientTimesheetAggregation[]> {
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
    const startOfWeek =
      this.config.startOfWeek != undefined ? this.config.startOfWeek : 6;
    const startDate = new Date(
      relativeToDate.getFullYear(),
      relativeToDate.getMonth(),
      relativeToDate.getDate() -
        ((relativeToDate.getDay() - startOfWeek + 7) % 7),
    );
    return this.analyzeDateRange(
      startDate,
      (date) =>
        date.getDate() == startDate.getDate() || date.getDay() !== startOfWeek,
    );
  }

  private async analyzeDateRange(
    startDate: Date,
    condition: (date: Date) => boolean,
  ): Promise<ClientTimesheetAggregation[]> {
    const journalDays = [];
    let currentDate = startDate;
    while (condition(currentDate)) {
      const journalDay = await this.analyzeDay({
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1,
        day: currentDate.getDate(),
      });
      journalDays.push(journalDay);
      currentDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate() + 1,
      );
    }

    const journalDayRange = new JournalDayRange(journalDays);
    return journalDayRange.aggregate();
  }
}
