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
status = "not-started"
owners = ["charlie"]
dependencies = []

[planning.estimate_days]
min = 2
max = 4
expected = 3

[ui_design]
summary = "UI/UX design"
description = "Design user interface and user experience for mobile platforms"
status = "not-started"
owners = ["diana"]
dependencies = ["planning"]

[ui_design.estimate_days]
min = 10
max = 15
expected = 12

[ios_development]
summary = "iOS app development"
description = "Develop native iOS application"
status = "not-started"
owners = ["charlie"]
dependencies = ["ui_design"]

[ios_development.estimate_days]
min = 15
max = 25
expected = 20

[android_development]
summary = "Android app development"
description = "Develop native Android application"
status = "not-started"
owners = ["diana"]
dependencies = ["ui_design"]

[android_development.estimate_days]
min = 15
max = 25
expected = 20

[testing]
summary = "Testing and quality assurance"
description = "Test both iOS and Android versions thoroughly"
status = "not-started"
owners = ["charlie", "diana"]
dependencies = ["ios_development", "android_development"]

[testing.estimate_days]
min = 5
max = 8
expected = 6

[deployment]
summary = "App store deployment"
description = "Deploy to App Store and Google Play Store"
status = "not-started"
owners = ["charlie"]
dependencies = ["testing"]

[deployment.estimate_days]
min = 1
max = 3
expected = 2
```
