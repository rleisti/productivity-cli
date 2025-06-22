#! /usr/bin/env node

import { styleText } from "node:util";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import JournalService from "./journal/JournalService";
import JournalDay from "./journal/JournalDay";

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
      (args) => reportToday(args),
    )
    .help()
    .parse(hideBin(process.argv));

  process.exit(0);
})();

type Arguments = {
  journalPath: string;
};

async function reportToday(args: Arguments) {
  const journalService = new JournalService({
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
  const today = new Date();
  const data = await journalService.reportDay({
    year: today.getFullYear(),
    month: today.getMonth() + 1,
    day: today.getDate(),
  });
  showJournalDay(data);
}

function showJournalDay(journalDay: JournalDay) {
  console.log(
    "Detailed journal report for " + styleText(["bold"], journalDay.getDate()),
  );
  console.log("========================================");
  console.log();

  const clients = journalDay.getClients();
  if (clients.length === 0) {
    console.log(
      styleText(["italic"], "No journal entries recorded for this day."),
    );
    return;
  }

  console.log(
    `Total time spent: ${formatMinutes(journalDay.getTotalMinutes())}`,
  );
  console.log();

  for (const client of clients) {
    console.log(
      styleText(["bold"], client.client) +
        ` (${formatMinutes(client.minutes)}):`,
    );
    for (const project of client.projects) {
      console.log(
        "\t" +
          styleText(["bold"], project.project) +
          ` (${formatMinutes(project.minutes)})`,
      );
      for (const activity of project.activities) {
        console.log(
          "\t\t" +
            styleText(["bold"], activity.activity) +
            ` (${formatMinutes(activity.minutes)})`,
        );
        for (const note of activity.notes) {
          console.log("\t\t\t" + styleText(["italic"], note));
        }
      }
    }
  }
}

function formatMinutes(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${minutes}m`;
  }
}
