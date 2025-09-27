# Mobile App Development

Development of a new mobile application for both iOS and Android platforms.

## Admin

```toml
start_date = "2025-02-01"

[person.charlie]
availability = ["2025-02-01 to 2025-06-30 at 8 hours"]

[person.diana]
availability = ["2025-03-01 to 2025-06-30 at 6 hours"]
```

## Tasks

```toml
[planning]
summary = "Project planning and architecture"
description = "Define app architecture, technology stack, and project timeline"
owners = ["charlie"]
estimate_days = { min = 2, max = 4, expected = 3 }

[ui_design]
summary = "UI/UX design"
owners = ["diana"]
dependencies = ["planning"]
estimate_days = { min = 10, max = 15, expected = 12 }

[ios_development]
summary = "iOS app development"
owners = ["charlie"]
dependencies = ["ui_design"]
estimate_days = { min = 15, max = 25, expected = 20 }

[android_development]
summary = "Android app development"
owners = ["diana"]
dependencies = ["ui_design"]
estimate_days = { min = 15, max = 25, expected = 20 }

[testing]
summary = "Testing and quality assurance"
owners = ["charlie", "diana"]
dependencies = ["ios_development", "android_development"]
estimate_days = 6

[deployment]
summary = "App store deployment"
owners = ["charlie"]
dependencies = ["testing"]
estimate_days = { min = 1, max = 3, expected = 2}
```
