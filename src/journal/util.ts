import { Day, Month } from "./types";
import path from "node:path";
import { readOptionalFile, zeroPad } from "../util";

export function formatDay(day: Day): string {
  return `${zeroPad(day.year, 4)}-${zeroPad(day.month, 2)}-${zeroPad(day.day, 2)}`;
}

export function formatMonth(month: Month): string {
  return `${zeroPad(month.year, 4)}-${zeroPad(month.month, 2)}`;
}

export function formatDayRange(start: Day, duration: number): string {
  const end = new Date(start.year, start.month - 1, start.day + duration);
  return `${formatDay(start)} to ${formatDay(dateToDay(end))}`;
}

export function dateToDay(date: Date): Day {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

export async function loadJournalFile(
  basePath: string,
  day: Day,
): Promise<string> {
  return readOptionalFile(
    path.join(basePath, "" + day.year, `${formatDay(day)}.txt`),
  );
}
