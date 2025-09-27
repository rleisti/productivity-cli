# Productivity CLI

This project is a command-line productivity software tool, aimed at consulting IT professionals.

The goal of this project is to provide the professional with lightweight tools to
help them optimize their time. This includes:

- Tracking and reporting their time
- Summarizing their notes with the use of a large language model (LLM)
- Designing and managing projects

This project is designed around a professional that potentially works for multiple
clients on multiple projects per client. It might also be useful for anyone that
works for a single employer and wants to track their various projects, potentially
also including their own "side" projects.

## Prerequisites

- **mise**, tested with version 2025.9.2 linux-x64 (2025-09-05)

## Installation

```bash
mise run link
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
confidential client information to be compartmentalized to different
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

### Client notes

The tool supports processing generic daily notes associated with each client.
See the sample generated configuration file for details on how to inform the tool
on how to locate these notes for processing.

Within client notes, you may specify certain sections as "secret", which prevents
content within that section from being used by AI. To designate a section as secret,
do the following:

    <secret>
    In here I can put whatever I want, but it will not be used by the AI.
    </secret>

### Projects

The tool supports project design and management. Each client may have one or more
projects, and these projects are defined in markdown files. Below is a sample project:

````markdown
# Project X

Some description about the project

## Admin

```toml
start_date = "2025-05-01"

[person]

[person.me]
availability = ["2025-05-01 to 2025-12-20 at 7 hours"]
roles = ["admin", "dev"]

[person.you]
availability = ["2025-07-01 to 2025-08-31 at 3.5 hours", "2025-09-01 to 2025-12-20 at 3.5 hours"]
roles = ["dev"]
```

## Tasks

```toml
[T001]
summary = "Requirements"
description = "Collect and analyze requirements"
estimate_days = { min = 10, max = 40, expected = 15 }
status = "complete"
owners = ["me"]

[T003]
summary = "UX"
description = "User experience design"
dependencies = ["T001"]
estimate_days = 15
owners = ["dev"]
status = "in-progress"

[T004]
summary = "Dev"
dependencies = ["T001", "T003"]
estimate_days = { min = 10, max = 40, expected = 15 }
owners = ["dev"]
```
````

The project 'Admin' section defines the start date of the project, and the available staff. Staff members
are defined in the `person` map by identifier. Each staff member should be provided with a list of
availability periods, which are defined as a list of strings in the format of "YYYY-MM-DD to YYYY-MM-DD at ##.# hours".
Each availability period is defined as a range of dates, and the number of hours available per day during that range.
Staff members may also be assigned to roles using the `roles` array: roles allow a staff member to fulfill any project
task that calls for the given role.

The project 'Tasks' section defines the project tasks. Each task is defined by a unique identifier. Tasks may have
the following properties:

- `summary`: a short description of the task (will be visible on the graph)
- `description`: a longer description of the task (not visible on the graph)
- `estimate_days`: an estimate of the number of days required to complete the task. This may be specified either as
  a single number or a map. When specified as a map, the PERT estimation method is used to calculate the estimated days.
  The map contains the following keys:
  - `min`: the minimum number of days required to complete the task
  - `max`: the maximum number of days required to complete the task
  - `expected`: the expected number of days required to complete the task`
- `status`: the status of the task, one of "complete", "in-progress", or "not-started"
- `owners`: a list of staff members and/or roles that are responsible for completing the task
- `dependencies`: a list of task identifiers that must be completed before this task can be started`

# Development

This project uses:

- TypeScript for type-safe JavaScript development
- ESLint for code quality
- Prettier for consistent code formatting
- Jest for testing

## Scripts

```
mise run build      # compile the project
mise run dev        # run the command line interface; additional arguments are accepted
mise run fix        # fix any code formatting issues
mise run test       # run the unit tests, and also check for code quality and formatting issues
mise run smoke      # run a quick smoke test (not a real test)
```

## Project Structure

```
<root>
    |-- src/          # Source files
    |-- src/ai        # Code related to the AI-enabled functionality
    |-- src/editor    # Code related to launching an external editor
    |-- src/journal   # Code related to journal and timesheet processing
    |-- src/notes     # Code related to client notes
    |-- src/projects  # Code related to project management
    |-- testResource/ # Test resource files
```
