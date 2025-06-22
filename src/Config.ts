import { JournalReporterClientConfiguration } from "./journal/JournalReporter";
import * as toml from "toml";
import * as fs from "node:fs";

/**
 * A service which processes a configuration file.
 */
export default class Config {
  public readonly journalBasePath: string;
  public readonly startOfWeek: number;
  public readonly workDayClassifierName?: string;
  public readonly clients: JournalReporterClientConfiguration[];

  constructor(
    journalBasePath: string,
    startOfWeek: number,
    workDayClassifierName?: string,
    clients?: JournalReporterClientConfiguration[],
  ) {
    this.journalBasePath = journalBasePath;
    this.startOfWeek = startOfWeek;
    this.workDayClassifierName = workDayClassifierName;
    this.clients = clients ?? [];
  }

  /**
   * Load a configuration from the path, if the file exists.
   * Otherwise return a default configuration.
   *
   * @param path path to the configuration file.
   */
  public static async load(path: string): Promise<Config> {
    const readPromise = new Promise((resolve) => {
      fs.readFile(path, "utf8", (err, data) => {
        if (!err) {
          resolve(data);
        } else {
          resolve("");
        }
      });
    });
    const content = (await readPromise) as string;
    const data = toml.parse(content) as ConfigFile;

    const journalBasePath = data.journal_path ?? ".";
    const startOfWeek = mapStartOfWeek(data.start_of_week);
    const workDayClassifierName = data.work_days;
    const clients = [];

    if (data.clients) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for (const [_key, value] of Object.entries(data.clients)) {
        const clientValues = value as ClientConfig;
        clients.push({
          client: clientValues.id,
          targetHoursPerDay: clientValues.target_hours_per_day ?? 8,
          activityRoundingIncrement: clientValues.rounding_increment ?? 0,
          activityRoundingMethod: mapRoundingType(
            clientValues.rounding_type ?? "none",
          ),
        });
      }
    }

    return new Config(
      journalBasePath,
      startOfWeek,
      workDayClassifierName,
      clients,
    );
  }

  /**
   * Initialize a new configuration file template at the given path.
   *
   * @param path the path of the new configuration file.
   */
  public static init(path: string) {
    const templateContent = `
# The base path to the journal files.
# In this path should be a directory for each year, and within those
# are journal files named with the format YYYY-MM-DD.txt
journal_path = "~/journal"

# The day of the week on which the week starts for reporting purposes.
# May be on of "saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", or "friday".
# Defaults to "saturday".
start_of_week = "saturday"

# Specify the work-day classifier to use for reporting purposes.
# By default, or if an unknown name is specified, then all weekdays are considered work days.
# Other special classifiers includes:
#    - "nova_scotia" - Classifies all weekdays as work days, except for Nova Scotia paid holidays.
work_days = "general"

[clients]
    [clients.a]
        # Identifies the client in journal files.
        id = "ClientID"
        
        # The nominal number of hours to work per day for this client.
        target_hours_per_day = 8
        
        # The number of minutes to round activity durations to.
        rounding_increment = 0
        
        # The method to use for rounding activity durations to the specified increment.
        # One of "none", "round", or "round_up"
        rounding_type = "none"
    `;
    fs.writeFileSync(path, templateContent);
  }
}

function mapStartOfWeek(value?: string): number {
  switch (value) {
    case "sunday":
      return 0;
    case "monday":
      return 1;
    case "tuesday":
      return 2;
    case "wednesday":
      return 3;
    case "thursday":
      return 4;
    case "friday":
      return 5;
    default:
      return 6;
  }
}

function mapRoundingType(value: string): "none" | "round" | "roundUp" {
  switch (value) {
    case "round":
      return "round";
    case "round_up":
      return "roundUp";
    default:
      return "none";
  }
}

type ConfigFile = {
  journal_path?: string;
  start_of_week?: string;
  work_days?: string;
  clients?: ClientConfig[];
};

type ClientConfig = {
  id: string;
  target_hours_per_day?: number;
  rounding_increment?: number;
  rounding_type?: string;
};
