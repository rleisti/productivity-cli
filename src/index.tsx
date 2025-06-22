#! /usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import JournalService from "./journal/JournalService";
import { printJournalDay, printJournalReport } from "./journal/printing";
import { Day, Month } from "./journal/types";

(async () => {
  await yargs()
    .scriptName("productivity-cli")
    .usage("$0 <cmd> [args]")
    .options({
      journalPath: {
        type: "string",
        default: ".",
        description: "Path to the journal files.",
        alias: "j",
      },
    })
    .command(
      "today",
      "Generate a detailed report for today",
      () => {},
      async (args) => reportJournalForToday(args),
    )
    .command(
      "day <day>",
      "Generate a detailed report for a given day",
      (yargs) => {
        yargs.positional("day", {
          describe: "The date in format YYYY-MM-DD",
        });
      },
      async (args) => reportJournalForDay(args),
    )
    .command(
      "week [offset]",
      "Generate a summary report for a given week",
      (yargs) => {
        yargs.positional("offset", {
          describe:
            "The week offset from this week. 0 is this week, -1 is last week, etc. Defaults to 0",
          default: 0,
          type: "number",
        });
      },
      async (args) => reportJournalForWeek(args),
    )
    .command(
      "month <month>",
      "Generate a summary report for a given month",
      (yargs) => {
        yargs.positional("month", {
          describe: "The month in format YYYY-MM",
        });
      },
      async (args) => reportJournalForMonth(args),
    )
    .help()
    .parse(hideBin(process.argv));

  process.exit(0);
})();

interface Arguments {
  journalPath: string;
}

interface DayArguments extends Arguments {
  day: string;
}

interface WeekArguments extends Arguments {
  offset: number;
}

interface MonthArguments extends Arguments {
  month: string;
}

/**
 * Produce a detailed timesheet report for the current day
 *
 * @param args command line arguments.
 */
async function reportJournalForToday(args: Arguments) {
  const today = new Date();
  const data = await createJournalService(args).reportDay({
    year: today.getFullYear(),
    month: today.getMonth() + 1,
    day: today.getDate(),
  });
  printJournalDay(data);
}

/**
 * Product a detailed timesheet report for a given day.
 *
 * @param args command line arguments.
 */
async function reportJournalForDay(args: Arguments) {
  const { day } = args as DayArguments;
  const data = await createJournalService(args).reportDay(parseDay(day));
  printJournalDay(data);
}

async function reportJournalForWeek(args: Arguments) {
  const { offset } = args as WeekArguments;
  const data = await createJournalService(args).reportWeek(offset);
  printJournalReport(data);
}

async function reportJournalForMonth(args: Arguments) {
  const { month } = args as MonthArguments;
  const data = await createJournalService(args).reportMonth(parseMonth(month));
  printJournalReport(data);
}

/**
 * Create a JournalService, using configuration from the command-line arguments.
 *
 * @param args command line arguments.
 */
function createJournalService(args: Arguments): JournalService {
  return new JournalService({
    analyzer: {
      basePath: args.journalPath,
      workDayClassifier: (day) => {
        const date = new Date(day.year, day.month - 1, day.day);
        return date.getDay() !== 0 && date.getDay() !== 6;
      },
    },
    reporter: {
      clients: [],
    },
  });
}

function parseDay(day: string): Day {
  const dayRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
  const match = day.match(dayRegex);
  if (!match) {
    throw new Error(`Invalid day: ${day}`);
  }
  return {
    year: parseInt(match[1]),
    month: parseInt(match[2]),
    day: parseInt(match[3]),
  };
}

function parseMonth(month: string): Month {
  const monthRegex = /^(\d{4})-(\d{2})$/;
  const match = month.match(monthRegex);
  if (!match) {
    throw new Error(`Invalid month: ${month}`);
  }
  return {
    year: parseInt(match[1]),
    month: parseInt(match[2]),
  };
}
