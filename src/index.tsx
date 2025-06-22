#! /usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import JournalService from "./journal/JournalService";
import { printJournalDay } from "./journal/printing";

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
      (args) => reportJournalForToday(args),
    )
    .help()
    .parse(hideBin(process.argv));

  process.exit(0);
})();

type Arguments = {
  journalPath: string;
};

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
