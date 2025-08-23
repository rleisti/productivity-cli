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

## 2. Journal File Processing

### 2.1 File Structure Requirements

**REQ-007**: The system shall expect journal files to be organized in
directory structure `<journal_root>/<year>/<YYYY-MM-DD>.txt`.

**REQ-008**: The system shall parse journal files containing time entries
in format `HH:MM ClientID:ProjectID:ActivityID arbitrary notes`.

**REQ-009**: While analyzing time entries, the system shall ignore lines that do not match the time entry format.

### 2.2 Time Entry Processing

**REQ-010**: The system shal calculate time durations between consecutive time entries.

**REQ-011**: The system shal aggregate time by client, project, and activity hierarchically.

**REQ-012**: While client configuration specifies a rounding method other than 'none' and rounding_increment > 0,
then the system shall apply activity time rounding.

**REQ-013**: The system SHALL support the following rounding methods:

- none
- round
- round_up

### 2.3 Journal File Opening

**REQ-062**: When the "journal" command is used then the system shall ensure the appropriate journal file
exists and then open it using an external editor.

**REQ-063**: When no date parameter is provided for the "journal" command then the system shall use the
current date.

**REQ-064** When a date parameter is provided for the "journal" command then the system shall use the provided date.

**REQ-064**: When the "journal" command is used and the appropriate journal file does not yet exist then
the system shall ensure the path to the file exists and shall create the file prior to opening the file
with the external editor.

**REQ-065**: The system shall allow specifying the external editor to use for opening file using the "editor"
property in the configuration file.

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

## 4. AI-Powered Note Summarization

### 4.1 Note Gathering

**REQ-031**: The system shall gather notes from journal files by extracting non-time-entry lines.

**REQ-032**: The system shall gather notes from client-specific note files using configured notes_file_pattern.

**REQ-033**: The system shall filter out content enclosed in `<secret>` tags from client notes.

**REQ-034**: The system shall combine notes from multiple sources with XML-style tags for organization.

### 4.2 AI Service Integration

**REQ-035**: The system shall support extensible AI API integration for note summarization.

**REQ-036**: The system shall load AI service configuration including api_key and model parameters.

**REQ-037**: The system shall support configurable summarization prompts loaded from external files.

**REQ-038**: The system shall substitute {notes} placeholder in prompts with gathered note content.

### 4.3 Summarization Commands

**REQ-039**: The system shall generate summaries for a configurable number of days, defaulting to 7 days.

**REQ-040**: The system shall support starting day parameter for summarization range in YYYY-MM-DD format.

**REQ-041**: When the system is invoked to produce a summary for a time period where no notees exist then
the system shall return "No notes found for the specified period".

## 5. Command Line Interface

### 5.1 Command Structure

**REQ-042**: The system shall provide commands: init, today, day, week, month, summarize.

**REQ-043**: The system shall support global options: --config (-c) and --journalPath (-j).

**REQ-044**: When the system is invoked with no specific command then the system shall execute
the 'today' report.

### 5.2 Input Validation

**REQ-045**: The system shall validate date parameters in YYYY-MM-DD format.

**REQ-046**: The system shall validate month parameters in YYYY-MM format.

**REQ-047**: The system shall provide error messages for invalid date formats.

### 5.3 Output Formatting

**REQ-048**: The system shall display timesheet reports with clear client/project/activity hierarchy.

**REQ-049**: The system shall show both actual and rounded time values in reports.

**REQ-050**: The system shall display target vs. actual time comparisons in summary reports.

**REQ-051**: The system shall format time durations in hours and minutes.

## 6. Data Security and Privacy

### 6.1 Secret Handling

**REQ-052**: The system shall filter content within `<secret>...</secret>` tags from AI summarization input.

**REQ-053**: The system shall not log or expose API keys in console output or error messages.

### 6.2 File Access

**REQ-054**: The system shall handle file access errors gracefully by providing informative error messages.

**REQ-055**: The system shall support optional file reading so that missing files do not cause system failure.

## 7. Performance and Reliability

### 7.1 Error Handling

**REQ-056**: The system shall provide meaningful error messages for configuration file parsing errors.

**REQ-057**: The system shall handle missing journal files without crashing.

**REQ-058**: The system shall validate AI service connectivity before processing summarization requests.

### 7.2 Data Processing

**REQ-059**: The system shall process journal files incrementally to support large datasets.

**REQ-060**: The system shall maintain data consistency during time aggregation calculations.

**REQ-061**: The system shall handle timezone considerations for daily boundary calculations.
