# Productivity CLI

This project is a command-line productivity software tool, aimed at consulting IT professionals.

The goal of this project is to provide the professional with lightweight tools to
help them optimize their time. This includes:

- Tracking and reporting their time
- Summarizing their notes and providing reminders (upcoming)

This project is designed around a professional that potentially works for multiple
clients on multiple projects per client. It might also be useful for anyone that
works for a single employer and wants to track their various projects, potentially
also including their own "side" projects.

## Prerequisites

- **npm**, tested with version 10.9.2
- **node**, tested with version 22.16.0

## Installation

```bash
bun run link
```

## Usage

After performing the linking step above, you can run the tool and see
available options using:

```bash
productivity-cli --help
```

### Configuration file

The tool accepts an optional configuration file. You may specify a file
name as an argument when running the tool, or the tool may automatically
find and use a file named `.productivty-cli.toml` if it exists in the
current directory. Use the following to generate a new configuration file,
which includes documentation on the available parameters:

```bash
productivity-cli init
```

### Journal files

The tool is built around a workflow of maintaining a journal file per day,
where the professional records their time and any other general notes.
Client-specific notes will be handled by separate files, allowing
confidential client information to be compartemntalized to different
storage locations.

Journal files are organized into a root directory, under which should be
a directory for each year. Within the year directory, journal files may
be created for each day with the naming scheme `YYYY-MM-DD.txt`:

```
<journal root>
    |-- 2025
        | -- 2025-01-01.txt
        | -- 2025-02-02.txt
        ...
```

Journal files may contain free-form text in addition to specially
formatted lines corresponding to timesheet entries. A timesheet
entry line is formatted as:

```
HH:MM     ClientID:ProjectID:ActivityID  arbitrary notes
HH:MM     abitrary text
```

The hours are in 24 hour format. The following is a sample:

```
08:00   ClientOne:ProjectOne:dev   I developed a thing
08:30   ClientTwo:ProjectX:doc     I wrote a thing
09:00   break
```

The first two entries indicate the start time of tasks relating to
specific clients, projects, and activity IDs. The third line indicates
the start of a non-work period. (because it does not match the
`ClientID:ProjectID:ActivityID` format, otherwise the word "break" is
arbitrary)

# Development

This project uses:

- TypeScript for type-safe JavaScript development
- ESLint for code quality
- Prettier for consistent code formatting
- Jest for testing

## Setup

This project includes a client-side git hook to ensure commits pass all quality checks.
To enable it, run:

```
bun setup:git
```

## Scripts

```
bun run build       # compile the project
bun dev             # run the command line interface; additional arguments are accepted
bun lint            # check for code quality issues
bun prettier        # check for code formatting issues
bun prettier:fix    # fix any code formatting issues
bun test            # run the unit tests
bun smoke           # run a quick smoke test (not a real test)
```

## Project Structure

```
<root>
    |-- src/          # Source files
    |-- testResource/ # Test resource files
```
