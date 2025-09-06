# Website Redesign Project

This project involves redesigning the company website to improve user experience and modernize the design.

## Admin

```toml
start_date = "2025-01-06"

[person.alice]
availability = [
    "2025-01-06 to 2025-02-28 at 8 hours",
    "2025-03-01 to 2025-03-31 at 4 hours"
]

[person.bob]
availability = ["2025-01-13 to 2025-03-31 at 6 hours"]
```

## Tasks

```toml
[research]
summary = "Research and user analysis"
description = "Conduct user research, analyze current site metrics, and define requirements"
status = "complete"
owners = ["alice"]
dependencies = []

[research.estimate_days]
min = 3
max = 5
expected = 4

[design]
summary = "Design wireframes and mockups"
description = "Create wireframes, design mockups, and establish design system"
status = "in-progress"
owners = ["alice"]
dependencies = ["research"]

[design.estimate_days]
min = 5
max = 8
expected = 6

[frontend]
summary = "Frontend development"
description = "Implement the new design using React and modern CSS"
status = "not-started"
owners = ["bob"]
dependencies = ["design"]

[frontend.estimate_days]
min = 8
max = 12
expected = 10

[backend]
summary = "Backend integration"
description = "Update backend APIs and integrate with new frontend"
status = "not-started"
owners = ["bob"]
dependencies = ["frontend"]

[backend.estimate_days]
min = 3
max = 5
expected = 4

[testing]
summary = "Testing and QA"
description = "Comprehensive testing across devices and browsers"
status = "not-started"
owners = ["alice", "bob"]
dependencies = ["backend"]

[testing.estimate_days]
min = 2
max = 4
expected = 3

[deployment]
summary = "Deployment and launch"
description = "Deploy to production and monitor launch"
status = "not-started"
owners = ["bob"]
dependencies = ["testing"]

[deployment.estimate_days]
min = 1
max = 2
expected = 1
```
