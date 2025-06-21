import { Day } from "./types";

export function formatDay(day: Day) {
  return `${zeroPad(day.year, 4)}-${zeroPad(day.month, 2)}-${zeroPad(day.day, 2)}`;
}

function zeroPad(value: number, length: number) {
  let result = "" + value;
  while (result.length < length) {
    result = "0" + result;
  }
  return result;
}
