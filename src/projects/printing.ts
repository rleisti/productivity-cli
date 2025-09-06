import { ProjectSummary } from "./ProjectDefinition";
import { formatDay } from "../journal/util";
import { styleText } from "node:util";

export function printProjectSummary(
  summary: ProjectSummary,
  clientId: string,
  projectId: string,
): void {
  console.log(
    "Project Summary: " + styleText(["bold"], `${clientId}/${projectId}`),
  );
  console.log("=====================================");
  console.log();

  console.log(
    styleText(["bold"], "Status: ") + formatProjectStatus(summary.status),
  );
  console.log(
    styleText(["bold"], "Total Estimated Days: ") +
      summary.totalEstimatedDays.toFixed(1),
  );
  console.log(
    styleText(["bold"], "Estimated Completion: ") +
      formatDay(summary.estimatedCompletionDate),
  );
  console.log(
    styleText(["bold"], "Completion Progress: ") +
      summary.completionPercentage +
      "%",
  );
}

function formatProjectStatus(status: string): string {
  switch (status) {
    case "not-started":
      return "Not started";
    case "in-progress":
      return "In progress";
    case "complete":
      return "Complete";
    default:
      return status;
  }
}
