#! /usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import JournalService from "./journal/JournalService";
import { printJournalDay, printJournalReport } from "./journal/printing";
import { Day, Month } from "./journal/types";
import Config from "./Config";
import { getWorkDayClassifier } from "./journal/workDay";
import NoteGatherer from "./ai/NoteGatherer";
import { getAiService } from "./ai/AiService";
import NoteSummarizer from "./ai/NoteSummarizer";
import PromptService from "./ai/PromptService";
import { EditorService } from "./editor/EditorService";
import { NodeProcessSpawner } from "./editor/NodeProcessSpawner";
import { ClientNotesService } from "./notes/ClientNotesService";
import { ProjectService } from "./projects/ProjectService";
import { printProjectSummary } from "./projects/printing";

(async () => {
  await yargs()
    .scriptName("productivity-cli")
    .usage("$0 [cmd] [args]")
    .options({
      config: {
        type: "string",
        default: ".productivity-cli.toml",
        description:
          "Path to a configuration file. Defaults to .productivity-cli.toml",
        alias: "c",
      },
      journalPath: {
        type: "string",
        description: "Path to the journal files.",
        alias: "j",
      },
    })
    .command(
      "$0",
      "Generate a detailed report for today (default command)",
      () => {},
      async (args) => reportJournalForToday(args),
    )
    .command(
      "init [path]",
      "Generate a template configuration file",
      (yargs) => {
        yargs.positional("path", {
          describe: "Path to the new configuration file",
          default: ".productivity-cli.toml",
        });
      },
      async (args) => init(args),
    )
    .command(
      "today",
      "Generate a detailed report for today",
      () => {},
      async (args) => reportJournalForToday(args),
    )
    .command(
      "day <day>",
      "Generate a detailed report for a given day",
      (yargs) => {
        yargs.positional("day", {
          describe: "The date in format YYYY-MM-DD",
        });
      },
      async (args) => reportJournalForDay(args),
    )
    .command(
      "week [offset]",
      "Generate a summary report for a given week",
      (yargs) => {
        yargs.positional("offset", {
          describe:
            "The week offset from this week. 0 is this week, -1 is last week, etc. Defaults to 0",
          default: 0,
          type: "number",
        });
      },
      async (args) => reportJournalForWeek(args),
    )
    .command(
      "month [month]",
      "Generate a summary report for a given month.",
      (yargs) => {
        yargs.positional("month", {
          describe:
            "The month in format YYYY-MM. Defaults to the current month.",
        });
      },
      (args) => reportJournalForMonth(args),
    )
    .command(
      "summarize [days] [startingDay]",
      "Generate a summary of notes for the last <days> days",
      (yargs) => {
        yargs
          .positional("days", {
            describe: "The number of days to summarize",
            type: "number",
            default: 7,
          })
          .positional("startingDay", {
            describe:
              "The relative starting day for the summary. Defaults to today. Format is YYYY-MM-DD.",
            type: "string",
          });
      },
      (args) => summarizeNotesForRange(args),
    )
    .command(
      "journal [day]",
      "Open a journal file in your preferred text editor",
      (yargs) => {
        yargs.positional("day", {
          describe: "The date in format YYYY-MM-DD. Defaults to today.",
          type: "string",
        });
      },
      async (args) => openJournal(args),
    )
    .command(
      "note <client> [day]",
      "Open a daily notes file for a given client",
      (yargs) => {
        yargs.positional("client", {
          description: "The client ID",
          type: "string",
        });
        yargs.positional("day", {
          describe: "The date in format YYYY-MM-DD. Defaults to today.",
          type: "string",
        });
      },
      async (args) => openNotes(args),
    )
    .command(
      "project-summary <client> <project>",
      "Generate a summary report for the specified project",
      (yargs) => {
        yargs.positional("client", {
          description: "The client identifier",
          type: "string",
        });
        yargs.positional("project", {
          description: "The project identifier",
          type: "string",
        });
        yargs.option("output", {
          description: "Output file name for the visualization",
          type: "string",
          default: "project.mmd",
        });
      },
      async (args) => generateProjectSummary(args),
    )
    .command(
      "project-init <client> <project>",
      "Generate a sample project definition file for the specified client and project",
      (yargs) => {
        yargs.positional("client", {
          description: "The client identifier",
          type: "string",
        });
        yargs.positional("project", {
          description: "The project identifier",
          type: "string",
        });
      },
      async (args) => initializeProject(args),
    )
    .help()
    .parse(hideBin(process.argv));

  process.exit(0);
})();

interface Arguments {
  config: string;
  journalPath?: string;
}

interface InitArguments extends Arguments {
  path: string;
}

interface DayArguments extends Arguments {
  day: string;
}

interface WeekArguments extends Arguments {
  offset: number;
}

interface MonthArguments extends Arguments {
  month: string;
}

interface SummarizeArguments extends Arguments {
  days: number;
  startingDay?: string;
}

interface JournalArguments extends Arguments {
  day?: string;
}

interface NoteArguments extends Arguments {
  client: string;
  day?: string;
}

interface ProjectSummaryArguments extends Arguments {
  client: string;
  project: string;
  output: string;
}

interface ProjectInitArguments extends Arguments {
  client: string;
  project: string;
}

function init(args: Arguments) {
  const { path } = args as InitArguments;
  Config.init(path);
}

/**
 * Produce a detailed timesheet report for the current day
 *
 * @param args command line arguments.
 */
async function reportJournalForToday(args: Arguments) {
  const journalService = await createJournalService(args);
  const data = await journalService.reportDay(getToday());
  printJournalDay(data);
}

/**
 * Product a detailed timesheet report for a given day.
 *
 * @param args command line arguments.
 */
async function reportJournalForDay(args: Arguments) {
  const { day } = args as DayArguments;
  const journalService = await createJournalService(args);
  const data = await journalService.reportDay(parseDay(day));
  printJournalDay(data);
}

async function reportJournalForWeek(args: Arguments) {
  const { offset } = args as WeekArguments;
  const journalService = await createJournalService(args);
  const data = await journalService.reportWeek(offset);
  printJournalReport(data);
}

async function reportJournalForMonth(args: Arguments) {
  const { month } = args as MonthArguments;
  const journalService = await createJournalService(args);
  const monthValue = month
    ? parseMonth(month)
    : { year: new Date().getFullYear(), month: new Date().getMonth() + 1 };
  const data = await journalService.reportMonth(monthValue);
  printJournalReport(data);
}

async function summarizeNotesForRange(args: Arguments) {
  const { days, startingDay } = args as SummarizeArguments;
  const config = await Config.load(args.config);
  const noteGatherer = new NoteGatherer({
    journalBasePath: args.journalPath ?? config.journalBasePath,
    clients: config.clients,
  });
  const aiService = getAiService(config);
  const promptService = new PromptService(config.prompts);
  const noteSummarizer = new NoteSummarizer({
    aiService,
    noteGatherer,
    promptService,
  });
  const relativeTo = startingDay ? parseDay(startingDay) : undefined;
  const summary = await noteSummarizer.summarizeRange(days, relativeTo);
  console.log(summary);
}

async function openJournal(args: Arguments) {
  const { day } = args as JournalArguments;
  const config = await Config.load(args.config);
  const journalService = await createJournalService(args);
  const editorService = new EditorService({
    editor: config.editor,
    processSpawner: new NodeProcessSpawner(),
  });
  const targetDay = day ? parseDay(day) : getToday();
  await editorService.openFile(journalService.getJournalFilePath(targetDay));
}

async function openNotes(args: Arguments) {
  const { client, day } = args as NoteArguments;
  const config = await Config.load(args.config);
  const editorService = new EditorService({
    editor: config.editor,
    processSpawner: new NodeProcessSpawner(),
  });
  const clientConfig = config.clients.find((c) => c.client === client);
  if (clientConfig === undefined) {
    throw new Error(`Client ${client} not found in configuration`);
  }
  const targetDay = day ? parseDay(day) : getToday();
  await editorService.openFile(
    new ClientNotesService(clientConfig).getDailyNotesPath(targetDay),
  );
}

async function generateProjectSummary(args: Arguments) {
  const { client, project, output } = args as ProjectSummaryArguments;
  const config = await Config.load(args.config);

  const projectService = new ProjectService({
    workDayClassifier: getWorkDayClassifier(
      config.workDayClassifierName ?? "general",
    ),
    clients: config.clients,
  });

  const summary = await projectService.generateProjectSummary(client, project);
  printProjectSummary(summary, client, project);

  await projectService.generateProjectVisualization(client, project, output);
  console.log(`Project visualization generated: ${output}`);
}

async function initializeProject(args: Arguments) {
  const { client, project } = args as ProjectInitArguments;
  const config = await Config.load(args.config);

  const projectService = new ProjectService({
    workDayClassifier: getWorkDayClassifier(
      config.workDayClassifierName ?? "general",
    ),
    clients: config.clients,
  });

  await projectService.initializeProject(client, project);
  console.log(`Sample project definition file created: ${client} ${project}`);
}

function getToday() {
  return {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate(),
  };
}

/**
 * Create a JournalService, using configuration from the command-line arguments.
 *
 * @param args command line arguments.
 */
async function createJournalService(args: Arguments): Promise<JournalService> {
  const config = await Config.load(args.config);

  return new JournalService({
    basePath: args.journalPath ?? config.journalBasePath,
    startOfWeek: config.startOfWeek,
    workDayClassifier: getWorkDayClassifier(
      config.workDayClassifierName ?? "default",
    ),
    clients: config.clients,
  });
}

function parseDay(day: string): Day {
  const dayRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
  const match = day.match(dayRegex);
  if (!match) {
    throw new Error(`Invalid day: ${day}`);
  }
  return {
    year: parseInt(match[1]),
    month: parseInt(match[2]),
    day: parseInt(match[3]),
  };
}

function parseMonth(month: string): Month {
  const monthRegex = /^(\d{4})-(\d{2})$/;
  const match = month.match(monthRegex);
  if (!match) {
    throw new Error(`Invalid month: ${month}`);
  }
  return {
    year: parseInt(match[1]),
    month: parseInt(match[2]),
  };
}
