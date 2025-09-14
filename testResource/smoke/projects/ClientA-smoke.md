# Smoke Test Project

A sample project for the smoke test.

## Admin

```toml
start_date = "2025-01-01"

[person.alice]
availability = ["2025-01-01 to 2025-06-30 at 8 hours"]

[person.bob]
availability = ["2025-01-01 to 2025-06-30 at 6 hours"]

[person.charlie]
availability = ["2025-01-15 to 2025-06-30 at 4 hours"]
```

## Tasks

```toml
[requirements]
summary = "Requirements"
description = "Detailed requirements gathering and documentation"
status = "complete"
owners = ["alice"]
dependencies = []
estimate_days = { min = 10, max = 40, expected = 15 }

[servicea-dd]
summary = "Service A - DD"
description = "Detailed design for Service A"
status = "complete"
owners = ["alice"]
dependencies = ["requirements"]
estimate_days = { min = 1, max = 5, expected = 2 }

[servicea-dev]
summary = "Service A - Dev"
description = "Development of Service A"
status = "in-progress"
owners = ["bob"]
dependencies = ["servicea-dd"]
estimate_days = { min = 3, max = 10, expected = 5 }

[servicea-test]
summary = "Service A - Test"
description = "Testing of Service A"
status = "not-started"
owners = ["charlie"]
dependencies = ["servicea-dev"]
estimate_days = { min = 2, max = 6, expected = 3 }

[serviceb-dd]
summary = "Service B - DD"
description = "Detailed design for Service B"
status = "not-started"
owners = ["alice"]
dependencies = ["requirements"]
estimate_days = { min = 5, max = 20, expected = 10 }

[serviceb-dev]
summary = "Service B - Dev"
description = "Development of Service B"
status = "not-started"
owners = ["bob"]
dependencies = ["servicea-dd"]
estimate_days = { min = 10, max = 30, expected = 15 }

[serviceb-test]
summary = "Service B - Test"
description = "Testing of Service B"
status = "not-started"
owners = ["charlie"]
dependencies = ["serviceb-dev"]
estimate_days = { min = 5, max = 20, expected = 10 }

[system-dev]
summary = "Integration"
description = "System integration"
status = "not-started"
owners = ["bob"]
dependencies = ["servicea-dev", "serviceb-dev"]
estimate_days = { min = 2, max = 10, expected = 5 }

[system-test]
summary = "Test"
description = "System testing"
status = "not-started"
owners = ["charlie"]
dependencies = ["system-dev"]
estimate_days = { min = 10, max = 20, expected = 12 }
```
