import * as toml from "toml";
import * as fs from "node:fs";
import { AnthropicAiModelConfiguration } from "./ai/AnthropicAiService";
import { NoteGathererClientConfiguration } from "./ai/NoteGatherer";
import { JournalClientConfiguration } from "./journal/types";

type ConfigClientConfiguration = JournalClientConfiguration &
  NoteGathererClientConfiguration;

type ConfigConstructorOptions = {
  journalBasePath: string;
  startOfWeek: number;
  workDayClassifierName?: string;
  aiService?: string;
  editor?: string;
  clients?: ConfigClientConfiguration[];
  prompts?: Prompts;
  anthropic?: AnthropicAiModelConfiguration;
};

export type Prompts = {
  summarizeNotes?: string;
};

/**
 * A service which processes a configuration file.
 */
export default class Config {
  public readonly journalBasePath: string;
  public readonly startOfWeek: number;
  public readonly workDayClassifierName?: string;
  public readonly aiService?: string;
  public readonly editor: string;
  public readonly clients: ConfigClientConfiguration[];
  public readonly prompts: Prompts;
  public readonly anthropic?: AnthropicAiModelConfiguration;

  constructor({
    journalBasePath,
    startOfWeek,
    workDayClassifierName,
    aiService,
    editor,
    clients,
    prompts,
    anthropic,
  }: ConfigConstructorOptions) {
    this.journalBasePath = journalBasePath;
    this.startOfWeek = startOfWeek;
    this.workDayClassifierName = workDayClassifierName;
    this.aiService = aiService;
    this.editor = editor ?? "vim";
    this.clients = clients ?? [];
    this.prompts = prompts ?? {};
    this.anthropic = anthropic;
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
    const aiService = data.ai_service;
    const editor = data.editor;

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
          notesFilePattern: clientValues.notes_file_pattern ?? "",
        });
      }
    }

    const prompts: Prompts = {};
    if (data.prompts) {
      prompts.summarizeNotes = data.prompts.summarize_notes;
    }

    const anthropic = data.anthropic
      ? {
          apiKey: data.anthropic.api_key,
          model: data.anthropic.model,
        }
      : undefined;

    return new Config({
      journalBasePath,
      startOfWeek,
      workDayClassifierName,
      aiService,
      editor,
      clients,
      prompts,
      anthropic,
    });
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

# Specify the AI service to use.
# May be one of "anthropic", or "none".
# The "none" model is only useful for investigation, as it just returns the prompt.
aiService = "anthropic"

# Specify the text editor command to use for opening files.
editor = "vim"

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
    
    # A file pattern to use for gathering notes for this client.
    # The following placeholders will be subsituted:
    # - {year} the 4 digit year
    # - {month} the 2 digit month
    # - {day} the 2 digit day
    notes_file_pattern = "notes/ClientID/{year}-{month}-{day}.txt"
        
[prompts]
# The path to the file containing the prompt to use for summarizing notes.
# The file content may contain the following placeholders:
# - {notes} the combined note content for summarization
summarize_notes = ".productivity-cli/prompts/summarize-notes.txt"
        
[anthropic]

# Specify your Anthropic API key.
api_key = "YOUR_API_KEY"

# Specify the model you want to use.
model = "claude-3-5-haiku-latest"
    `;

    if (fs.existsSync(path)) {
      throw new Error(`Configuration file already exists at ${path}`);
    }
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
  ai_service?: string;
  editor?: string;
  clients?: ClientConfig[];
  prompts?: PromptConfig;
  anthropic?: AnthropicConfig;
};

type ClientConfig = {
  id: string;
  target_hours_per_day?: number;
  rounding_increment?: number;
  rounding_type?: string;
  notes_file_pattern?: string;
};

type PromptConfig = {
  summarize_notes?: string;
};

type AnthropicConfig = {
  api_key: string;
  model: string;
};
