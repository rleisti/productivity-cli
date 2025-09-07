# Requirements Specification

## 1. Configuration Management

### 1.1 Configuration File Loading

**REQ-001**: The system shall load configuration from a TOML file specified
by the `--config` parameter with default value `.productivity-cli.toml`.

**REQ-002**: When a configuration file does not exist, the system shall provide default configuration values.

**REQ-003**: When the 'init' command is executed, the system shall generate a template configuration file.

### 1.2 Configuration Validation

**REQ-004**: The system shall validate that the journal_path configuration parameter points to an accessible directory.

**REQ-005**: The system shall support start_of_week configuration with values:

- saturday (default)
- sunday
- monday
- tuesday
- wednesday
- thursday
- friday

**REQ-006**: The system shall support work_days classifier configuration with values

- general (default)
- nova_scotia

### 1.3 Configuration Settings

**REQ-065**: The system shall allow specifying an external editor to use for opening files using the "editor"
property in the configuration file.

## 2. Journal File Processing

### 2.1 File Structure Requirements

**REQ-007**: The system shall expect journal files to be organized in
directory structure `<journal_root>/<year>/<YYYY-MM-DD>.txt`.

**REQ-008**: The system shall parse journal files containing time entries
in format `HH:MM ClientID:ProjectID:ActivityID arbitrary notes`.

**REQ-009**: While analyzing time entries, the system shall ignore lines that do not match the time entry format.

### 2.2 Time Entry Processing

**REQ-010**: The system shall calculate time durations between consecutive time entries.

**REQ-011**: The system shall aggregate time by client, project, and activity hierarchically.

**REQ-012**: While client configuration specifies a rounding method other than 'none' and rounding_increment > 0,
then the system shall apply activity time rounding.

**REQ-013**: The system SHALL support the following rounding methods:

- none
- round
- round_up

### 2.3 Journal File Editing

**REQ-062**: When the "journal" command is used then the system shall ensure the appropriate journal file
exists and then open it using an external editor.

**REQ-063**: When no date parameter is provided for the "journal" command then the system shall use the
current date.

**REQ-064** When a date parameter is provided for the "journal" command then the system shall use the provided date.

**REQ-064**: When the "journal" command is used and the appropriate journal file does not yet exist then
the system shall ensure the path to the file exists and shall create the file prior to opening the file
with the external editor.

### 2.3 Client Configuration

**REQ-014**: The system shall support per-client target_hours_per_day configuration, defaulting to 8 hours.

**REQ-015**: The system shall support per-client rounding_increment configuration in minutes, defaulting to 0.

**REQ-016**: The system shall support per-client notes_file_pattern configuration with placeholders {year}, {month}, {day}.

## 3. Reporting Capabilities

### 3.1 Daily Reports

**REQ-017**: The system shall generate detailed daily timesheet reports showing client, project, and activity breakdowns.

**REQ-018**: The system shall display actual minutes and rounded minutes for each timesheet entry.

**REQ-019**: The system shall include activity notes in daily reports.

**REQ-020**: When the system is invoked with no date parameter for a day-related command
then the system shall report for today.

### 3.2 Weekly Reports

**REQ-021**: The system shall generate weekly summary reports based on configured start_of_week.

**REQ-022**: The system shall accept week offset parameter where 0 represents current week, -1 represents previous week, etc.

**REQ-023**: The system shall calculate target hours based on elapsed work days within the reporting period.

### 3.3 Monthly Reports

**REQ-024**: The system shall generate monthly summary reports for a specified month in YYYY-MM format.

**REQ-025**: When the system is invokd with no month for the monthly report command, then the system shall
default to the current month.

**REQ-026**: The system shall aggregate all days within the specified month.

### 3.4 Work Day Classification

**REQ-027**: The system shall classify Monday through Friday as work days for general work_days configuration.

**REQ-028**: While nova_scotia work_days configuration is specified then the system shall exclude
Nova Scotia statutory holidays from work days.

**REQ-029**: The system shall calculate Good Friday dates using an Easter calculation algorithm.

**REQ-030**: The system shall handle holiday observation rules where holidays falling on weekends
are observed on adjacent work days.

## 4. Note Management

### 4.1 Note Gathering

**REQ-031**: The system shall gather notes from journal files by extracting non-time-entry lines.

**REQ-032**: The system shall gather notes from client-specific note files using configured notes_file_pattern.

**REQ-033**: The system shall filter out content enclosed in `<secret>` tags from client notes.

**REQ-034**: The system shall combine notes from multiple sources with XML-style tags for organization.

### 4.2 Journal File Editing

**REQ-066**: When the "note" command is used, then the system shall ensure the appropriate note file
exists and then open it using an external editor.

**REQ-067**: The system shall accept a mandatory "client" parameter for the "note" command to identify
which client the note belongs to. The value of the "client" parameter must correspond to a client identifier
specified in the configuration file.

**REQ-068**: When no date parameter is provided for the "note" command then the system shall use the
current date.

**REQ-069** When a date parameter is provided for the "note" command then the system shall use the provided date.

**REQ-070**: When the "note" command is used and the appropriate note file does not yet exist then
the system shall ensure the path to the file exists and shall create the file prior to opening the file
with the external editor.

### 4.3 AI Service Integration

**REQ-035**: The system shall support extensible AI API integration for note summarization.

**REQ-036**: The system shall load AI service configuration including api_key and model parameters.

**REQ-037**: The system shall support configurable summarization prompts loaded from external files.

**REQ-038**: The system shall substitute {notes} placeholder in prompts with gathered note content.

### 4.4 Summarization Commands

**REQ-039**: The system shall generate summaries for a configurable number of days, defaulting to 7 days.

**REQ-040**: The system shall support starting day parameter for summarization range in YYYY-MM-DD format.

**REQ-041**: When the system is invoked to produce a summary for a time period where no notees exist then
the system shall return "No notes found for the specified period".

## 5. Projects

### 5.1 Project Definition

**REQ-071**: The system shall support project definitions in markdown format.

**REQ-072**: When a project_file_pattern is specified in the configuration file for a client then the system
shall recognize project definitions in files matching the pattern.

**REQ-073**: The project_file_pattern configuration shall support the following placeholders:

- `{id}`: the project identifier

**REQ-074**: Project definition files shall support the following sections:

- `## Admin`: defines project scheduling and resource information
- `## Tasks`: defines the project work breakdown structure

**REQ-075**: The project definition file 'Admin' section shall support an embedded TOML document with the
following properties:

- `start_date`: the project start date in YYYY-MM-DD format
- `person`: a map of person identifiers to person properties, consisting of:
  - `availability`: an array of availability periods in the format `YYYY-MM-DD to YYYY-MM-DD at # hours`
    indicating the start and end dates of the person's availability for the project, and the number of hours
    per day (decimal value) that the person is available for the project.

**REQ-076**: The project definition file 'Tasks' section shall support an embedded TOML document with the
following properties:

- `<task id>`: a map describing a given task with the given identifier, consisting of the following properties:
  - `summary`: the short description of the task
  - `description`: the full task description
  - `estimate_days`: a map describing the task estimate, comprising the following properties:
    - `min`: the minimum number of days to complete the task
    - `max`: the maximum number of days to complete the task
    - `expected`: the expected number of days to complete the task
  - `status`: the status of the task, one of: `not-started`, `in-progress`, `complete`
  - `owners`: an array of person identifiers that are responsible for completing the task
  - `dependencies`: an array of task identifiers that must be completed before the task can be started

**REQ-088**: When the system is invoked with the 'project-init' command, then the system shall generate a sample
project definition file for a given client and project identifier.

**REQ-089**: The 'project-init' command shall accept the following positional parameters:

- the client identifier
- the project identifier

### 5.2 Project Summary Report

**REQ-077**: When the system is invoked with the 'project-summary' command then the system shall generate
a summary report for the specified project.

**REQ-078**: The 'project-summary' command shall accept the following positional parameters:

- the client identifier
- the project identifier

**REQ-079**: The 'project-summary' command shall report the following for the specified project:

- The overall project status as:
  - "Not started" if all the tasks have the 'not-started' status
  - "In progress" if any of the tasks have the 'in-progress' or 'complete' status
  - "Complete" if all the tasks have the 'complete' status
- The total estimated days for the project, determined by the following rules:
  - For any given task, the estimated days is calculated by the formula `(MIN + MAX + 4 * EXPECTED) / 6`
    where `MIN` is the minimum estimate, `MAX` is the maximum estimate, and `EXPECTED` is the expected
    estimate.
  - The total project estimate is the sum of the estimates for all tasks that are in the critical path.
  - The critical path is defined as the set of tasks that make up the longest path, by estimate, from the start task
    to the end task.
- The estimated project completion date, calculated by adding the total estimated days to the start date of the project,
  and considering only business days. (as defined by the `work_days` configuration)
- The project completion percentage, calculated by dividing the total estimated days by the number of days of completed
  effort determined by summing the estimated days for all tasks that have status 'complete'

### 5.3 Project Visualization

**REQ-080**: When the system is invoked with the 'project-visualize' command then the system shall generate a
graph (mermaidJS file) depicting the project work breakdown structure.

**REQ-081**: The 'project-visualize' command shall accept the following positional parameters:

- the client identifier
- the project identifier

**REQ-082**: The 'project-visualize' command shall accept an optional `--output` parameter to specify the output
file name.

**REQ-083**: When no `--output` parameter is specified and the `project-visualize` command is invoked, then the
system shall generate an image file in the current working directory with the name `project.mmd`.

**REQ-084**: The project visualization shall display a graph where edges represent tasks and vertices are used to
group dependencies for the task, by having tasks which are dependencies point at a vertex while tasks which are
dependents point away from the vertex.

**REQ-085**: Each edge shall be labeled by the task summary.

**REQ-086**: Each vertex shall be labelled by the estimated days to arrive at that vertex, determined by the
critical path algorithm considering all tasks which point at the vertex.

## 6. Command Line Interface

### 6.1 Command Structure

**REQ-043**: The system shall support global options: --config (-c).

**REQ-044**: When the system is invoked with no specific command then the system shall execute
the 'today' report.

### 6.2 Input Validation

**REQ-045**: The system shall validate date parameters in YYYY-MM-DD format.

**REQ-046**: The system shall validate month parameters in YYYY-MM format.

**REQ-047**: The system shall provide error messages for invalid date formats.

### 6.3 Output Formatting

**REQ-048**: The system shall display timesheet reports with clear client/project/activity hierarchy.

**REQ-049**: The system shall show both actual and rounded time values in reports.

**REQ-050**: The system shall display target vs. actual time comparisons in summary reports.

**REQ-051**: The system shall format time durations in hours and minutes.

## 7. Data Security and Privacy

### 7.1 Secret Handling

**REQ-052**: The system shall filter content within `<secret>...</secret>` tags from AI summarization input.

**REQ-053**: The system shall not log or expose API keys in console output or error messages.
