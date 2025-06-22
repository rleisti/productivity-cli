import JournalDay from "./JournalDay";
import { styleText } from "node:util";

/**
 * Print the details of a single day's timesheet details to the console.
 *
 * @param journalDay the detailed timesheet data to print
 */
export function printJournalDay(journalDay: JournalDay) {
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
