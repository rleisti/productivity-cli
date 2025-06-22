import { Day } from "./types";

type classifier = (day: Day) => boolean;

/**
 * Retrieve a work-day classifier given a known name.
 *
 * If the name is unknnown, then defaults to a classifier that classifies
 * all weekdays (Monday through Friday).
 *
 * @param name the name of the classifier
 */
export function getWorkDayClassifier(name: string): classifier {
  switch (name) {
    case "nova_scotia":
      return classifyForNovaScotiaHolidays;
    default:
      return classifyAllWeekdays;
  }
}

function classifyAllWeekdays(day: Day): boolean {
  const date = new Date(day.year, day.month - 1, day.day);
  return date.getDay() !== 0 && date.getDay() !== 6;
}

function classifyForNovaScotiaHolidays(day: Day): boolean {
  return (
    classifyAllWeekdays(day) &&
    classifyNewYearsDay(day) &&
    classifyNovaScotiaHeritageDay(day) &&
    classifyGoodFriday(day) &&
    classifyCanadaDay(day) &&
    classifyLabourDay(day) &&
    classifyChristmasDay(day)
  );
}

function classifyNewYearsDay(day: Day): boolean {
  return getClassifierForDayOrNextWorkingDay(1, 1)(day);
}

function classifyNovaScotiaHeritageDay(day: Day): boolean {
  let mondayCount = 0;
  const designatedDate = new Date(day.year, 1, 1);
  while (mondayCount < 3) {
    if (designatedDate.getDay() == 1) {
      mondayCount++;
    }

    if (mondayCount < 3) {
      designatedDate.setDate(designatedDate.getDate() + 1);
    }
  }
  return classifierForSpecificDate(designatedDate)(day);
}

function classifyCanadaDay(day: Day): boolean {
  return getClassifierForDayOrNextWorkingDay(7, 1)(day);
}

function classifyChristmasDay(day: Day): boolean {
  return getClassifierForDayOrNextWorkingDay(12, 25)(day);
}

function getClassifierForDayOrNextWorkingDay(
  month: number,
  dayOfMonth: number,
): classifier {
  return (day) => {
    const designatedDate = new Date(day.year, month - 1, dayOfMonth);
    if (designatedDate.getDay() == 0) {
      designatedDate.setDate(designatedDate.getDate() + 1);
    } else if (designatedDate.getDay() == 6) {
      designatedDate.setDate(designatedDate.getDate() + 2);
    }

    return classifierForSpecificDate(designatedDate)(day);
  };
}

function classifyGoodFriday(day: Day): boolean {
  const a = day.year % 19;
  const b = Math.floor(day.year / 100);
  const c = day.year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const i = Math.floor(c / 4);
  const g = Math.floor((8 * b + 13) / 25);
  const h = (19 * a + b - d - g + 15) % 30;
  const k = c % 4;
  const l = (2 * e + 2 * i - k + 32 - h) % 7;
  const m = Math.floor((a + 11 * h + 19 * l) / 433);
  const days = h + l - 7 * m - 2;
  const month = Math.floor((days + 90) / 25);
  const dayOfMonth = (days + 33 * month + 19) % 32;
  const designatedDate = new Date(day.year, month - 1, dayOfMonth);
  return classifierForSpecificDate(designatedDate)(day);
}

function classifyLabourDay(day: Day): boolean {
  const designatedDate = new Date(day.year, 8, 1);
  while (designatedDate.getDay() != 1) {
    designatedDate.setDate(designatedDate.getDate() + 1);
  }

  return classifierForSpecificDate(designatedDate)(day);
}

function classifierForSpecificDate(designatedDate: Date): classifier {
  return (day) => {
    return (
      day.year != designatedDate.getFullYear() ||
      day.month != designatedDate.getMonth() + 1 ||
      day.day != designatedDate.getDate()
    );
  };
}
