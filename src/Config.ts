import { JournalReporterClientConfiguration } from "./journal/JournalReporter";
import * as toml from "toml";
import * as fs from "node:fs";

/**
 * A service which processes a configuration file.
 */
export default class Config {
  public readonly journalBasePath: string;
  public readonly clients: JournalReporterClientConfiguration[];

  constructor(
    journalBasePath: string,
    clients?: JournalReporterClientConfiguration[],
  ) {
    this.journalBasePath = journalBasePath;
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

    return new Config(journalBasePath, clients);
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

    /*
    return fs.writeFile(path, templateContent, (err) => {
      if (err) {
        throw err;
      }
    });
     */
    fs.writeFileSync(path, templateContent);
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
  clients?: ClientConfig[];
};

type ClientConfig = {
  id: string;
  target_hours_per_day?: number;
  rounding_increment?: number;
  rounding_type?: string;
};
