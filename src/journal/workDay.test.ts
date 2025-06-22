import { getWorkDayClassifier } from "./workDay";
import { Day } from "./types";

type classifier = (day: Day) => boolean;

describe("workDay Classifiers", () => {
  describe("Default", () => {
    const classifier = getWorkDayClassifier("default");

    test("should classify 2025 workdays", () => {
      testWorkdays(2025, classifier);
    });
  });

  describe("Nova Scotia", () => {
    const classifier = getWorkDayClassifier("nova_scotia");

    test("should classify 2025 holidays", () => {
      expect(classifier({ year: 2025, month: 1, day: 1 })).toBeFalsy();
      expect(classifier({ year: 2025, month: 2, day: 17 })).toBeFalsy();
      expect(classifier({ year: 2025, month: 4, day: 18 })).toBeFalsy();
      expect(classifier({ year: 2025, month: 7, day: 1 })).toBeFalsy();
      expect(classifier({ year: 2025, month: 9, day: 1 })).toBeFalsy();
      expect(classifier({ year: 2025, month: 12, day: 25 })).toBeFalsy();
      expect(countHolidays(2025, classifier)).toBe(6);
    });

    test("should classify 2026 holidays", () => {
      expect(classifier({ year: 2026, month: 1, day: 1 })).toBeFalsy();
      expect(classifier({ year: 2026, month: 2, day: 16 })).toBeFalsy();
      expect(classifier({ year: 2026, month: 4, day: 3 })).toBeFalsy();
      expect(classifier({ year: 2026, month: 7, day: 1 })).toBeFalsy();
      expect(classifier({ year: 2026, month: 9, day: 7 })).toBeFalsy();
      expect(classifier({ year: 2026, month: 12, day: 25 })).toBeFalsy();
      expect(countHolidays(2025, classifier)).toBe(6);
    });
  });
});

function testWorkdays(year: number, classifier: classifier) {
  const testDate = new Date(year, 0, 1);
  while (testDate.getFullYear() === year) {
    const day = {
      year: testDate.getFullYear(),
      month: testDate.getMonth() + 1,
      day: testDate.getDate(),
    };

    if (testDate.getDay() === 0 || testDate.getDay() === 6) {
      if (classifier(day)) {
        fail(`Did not expect ${day} to be a workday`);
      }
    } else if (!classifier(day)) {
      fail(`Expected ${day} to be a workday`);
    }

    testDate.setDate(testDate.getDate() + 1);
  }
}

function countHolidays(year: number, classifier: classifier): number {
  let holidayCount = 0;
  const testDate = new Date(year, 0, 1);
  while (testDate.getFullYear() === year) {
    if (testDate.getDay() !== 0 && testDate.getDay() !== 6) {
      const day = {
        year: testDate.getFullYear(),
        month: testDate.getMonth() + 1,
        day: testDate.getDate(),
      };
      if (!classifier(day)) {
        holidayCount++;
      }
    }

    testDate.setDate(testDate.getDate() + 1);
  }

  return holidayCount;
}
