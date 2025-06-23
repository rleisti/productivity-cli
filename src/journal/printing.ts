import JournalDay from "./JournalDay";
import { styleText } from "node:util";
import { TimesheetReport } from "./types";

/**
 * Print the details of a single day's timesheet details to the console.
 *
 * @param journalDay the detailed timesheet data to print
 */
export function printJournalDay(journalDay: JournalDay) {
  console.log(
    "Detailed report for " + styleText(["bold"], journalDay.getDate()),
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
        "    " +
          styleText(["bold"], project.project) +
          ` (${formatMinutes(project.minutes)})`,
      );
      for (const activity of project.activities) {
        console.log(
          "        " +
            styleText(["bold"], activity.activity) +
            ` (${formatMinutes(activity.minutes)})`,
        );
        for (const note of activity.notes) {
          console.log("            " + styleText(["italic"], note));
        }
      }
    }
  }
}

export function printJournalReport(report: TimesheetReport) {
  console.log("Summary report for " + styleText(["bold"], report.range));
  console.log("========================================");
  console.log();

  const clients = report.clients;
  if (clients.length === 0) {
    console.log(
      styleText(["italic"], "No journal entries recorded for this period."),
    );
    return;
  }

  for (const client of report.clients) {
    console.log(
      styleText(["bold"], client.client) +
        ` (${formatMinutes(client.roundedMinutes)} of ${formatMinutes(client.targetMinutes)}):` +
        styleText(["italic"], ` actual: `) +
        formatMinutes(client.actualMinutes) +
        ", " +
        styleText(["italic"], `period target: `) +
        formatMinutes(client.periodTargetMinutes),
    );

    for (const project of client.projects) {
      console.log(
        "    " +
          styleText(["bold"], project.project) +
          ` (${formatMinutes(project.roundedMinutes)}):` +
          styleText(["italic"], ` actual: `) +
          formatMinutes(project.actualMinutes),
      );
    }
  }
}

/**
 * Format a quantity of minutes to a human-readable form
 *
 * @param totalMinutes the quantity of minutes to print.
 */
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
