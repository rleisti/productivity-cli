# Projects Design

The projects feature is intended to provide tools for project estimation and tracking, per client.

## Project specification

Projects shall be defined by a project definition file. The definition file shall contain descriptions
and notes, a task breakdown, and status.

In the main configuration file, for each client, there shall be a way to specify a file path template
for project files.

### Design By Example

In the main configuration file, the `project_file_pattern` specifies the template for project files.
A placeholder `id` shall be used to allow naming files according to a project unique identifier.

```
[clients]
    [clients.a]
        client = "A"
        project_file_pattern = "~/clients/A/project-{id}.md"
```

Project files shall be treated as markdown files in general. Specifically, the system shall look for
special headings (denoted by one or more '#' at the start of a line) with specific titles to identify
sections of interest.

The system shall identify and process the following sections:

- _Admin_: a set of properties specified using TOML describing administrative details about the project.
- _Tasks_: a data structure specified using TOML describing the tasks, their dependencies, estimates, and status.

A sample project file:

````markdown
# Project X

Some description about the project

## Admin

```toml
start_date: 2025-05-01

[person]
[person.me]
availability = [ "2025-05-01 to 2025-12-20 at 7 hours" ]
[person.you]
availability = [ "2025-07-01 to 2025-08-31 at 3.5 hours", "2025-09-01 to 2025-12-20 at 3.5 hours" ]
```

## Tasks

```toml
[T001]
summary = "Requirements"
description = "Collect and analyze requirements"
estimate_days = { min: 10, max: 40, expected: 15 }
status = "in-progress"
owners = ["me"]

[T002]
summary = "UX"
description = "User experience design"
dependencies = ["T001"]
estimate_days = { min: 5, max: 30, expected: 8 }
owners = ["me", "you"]
status = "not-started"
```
````

## Project Tools

Given projects defined by project specification files, the following tools shall be provided to extract
and analyze information about the projects:

### Individual Project Summary

For a given project, report:

- the overall project status: not started, in progress, or complete
- the total estimated days of effort
- the remaining estimated days of effort
- the estimated days of effort currently spent
- percentage of the project complete, as defined by effort spent as a fraction of total estimated effort

### Project Execution

For a given project, report:

- The current critical path, including:
  - The list of tasks, their owners, and estimated
  - The total estimate of the critical path
- Available tasks and their free and total float

### Visualize tasks

Generate a diagram (for example, in graphviz or mermaidJs format) showing the graph of dependencies
and their floats.
