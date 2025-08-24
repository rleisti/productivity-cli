import { Day } from "../journal/types";
import { zeroPad } from "../util";

export type ClientNotesConfiguration = {
  /** The client identifier. */
  client: string;

  /** The path and file pattern for notes files. */
  notesFilePattern: string;
};

/**
 * A service for locating and manipulating client notes.
 */
export class ClientNotesService {
  config: ClientNotesConfiguration;

  constructor(config: ClientNotesConfiguration) {
    this.config = config;
  }

  /**
   * Return the path for a daily notes file, for a given day.
   */
  public getDailyNotesPath(day: Day): string {
    return this.config.notesFilePattern
      .replace(/\{year}/g, zeroPad(day.year, 4))
      .replace(/\{month}/g, zeroPad(day.month, 2))
      .replace(/\{day}/g, zeroPad(day.day, 2));
  }
}
