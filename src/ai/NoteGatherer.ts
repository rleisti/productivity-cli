import { loadJournalFile } from "../journal/util";
import { readOptionalFile } from "../util";
import { Day } from "../journal/types";
import {
  ClientNotesConfiguration,
  ClientNotesService,
} from "../notes/ClientNotesService";

type NoteGathererConfiguration = {
  /** Root directory of the journal files. */
  journalBasePath: string;

  clients: ClientNotesConfiguration[];
};

const journalLineRegex = /^(\d{2}:\d{2})\s+([A-Za-z0-9_:-]+)\s*(.*)$/;

/**
 * A service which gathers notes taken for a certain day
 */
export default class NoteGatherer {
  private readonly config: NoteGathererConfiguration;

  constructor(configuration: NoteGathererConfiguration) {
    this.config = configuration;
  }

  /**
   * Gather all notes taken on a certain day into a consolidated note.
   *
   * @param day the day to gather notes for.
   */
  public async findNotes(day: Day): Promise<string | undefined> {
    let note = await this.createJournalNote(day);

    for (const client of this.config.clients) {
      note += await this.createClientNote(client, day);
    }

    if (note.trim().length > 0) {
      return note;
    }

    return undefined;
  }

  private async createJournalNote(day: Day): Promise<string> {
    const journalContent = await loadJournalFile(
      this.config.journalBasePath,
      day,
    );
    const filteredJournalContent = journalContent
      .split("\n")
      .filter((line) => !line.match(journalLineRegex))
      .map((line) => line.trim())
      .join("\n")
      .trim();
    if (filteredJournalContent.length > 0) {
      return "<Journal>\n" + filteredJournalContent + "</Journal>\n\n";
    }
    return "";
  }

  private async createClientNote(
    client: ClientNotesConfiguration,
    day: Day,
  ): Promise<string> {
    const filePath = this.createClientNotePath(client, day);
    const clientNote = await readOptionalFile(filePath);
    if (clientNote.trim().length > 0) {
      return (
        "<" +
        client.client +
        ">\n" +
        filterSecretsFromClientNote(clientNote) +
        "</" +
        client.client +
        ">\n\n"
      );
    }
    return "";
  }

  private createClientNotePath(
    client: ClientNotesConfiguration,
    day: Day,
  ): string {
    return new ClientNotesService(client).getDailyNotesPath(day);
  }
}

const secretsRegex = /<secret>(.|\s)*?<\/secret>/g;

function filterSecretsFromClientNote(note: string): string {
  return note.replace(secretsRegex, "");
}
