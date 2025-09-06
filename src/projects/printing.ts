import { ProjectSummary } from "./ProjectDefinition";
import { formatDay } from "../journal/util";

export function printProjectSummary(
  summary: ProjectSummary,
  clientId: string,
  projectId: string,
): void {
  console.log(`Project Summary: ${clientId}/${projectId}`);
  console.log("=====================================");
  console.log();

  console.log(`Status: ${formatProjectStatus(summary.status)}`);
  console.log(`Total Estimated Days: ${summary.totalEstimatedDays.toFixed(1)}`);
  console.log(
    `Estimated Completion: ${formatDay(summary.estimatedCompletionDate)}`,
  );
  console.log(`Completion Progress: ${summary.completionPercentage}%`);
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
