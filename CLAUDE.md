# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Build and Run:**

- `bun run build` - Compile TypeScript to JavaScript in the `dist/` directory
- `bun dev [command]` - Build and run the CLI with additional arguments
- `bun run link` - Build and create global npm link for local development

**Code Quality:**

- `bun lint` - Run ESLint on source files
- `bun prettier` - Check code formatting
- `bun prettier:fix` - Auto-fix code formatting issues
- `bun test` - Run Jest unit tests
- `bun smoke` - Run smoke tests with test resources

**Testing Individual Components:**
Tests use Jest and follow the pattern `*.test.ts`. Run specific tests with:
`bunx jest <test-file-pattern>`

## Architecture Overview

This is a TypeScript CLI application for productivity tracking with two main functional domains:

### Journal System (`src/journal/`)

- **Purpose**: Time tracking and timesheet generation from daily journal files
- **Key Components**:
  - `JournalService.ts` - Main service orchestrating journal operations
  - `JournalAnalyzer.ts` - Core analysis logic for processing journal entries
  - `JournalDayReader.ts` - Reads and parses individual journal files
  - `printing.ts` - Output formatting for reports
  - `workDay.ts` - Work day classification logic
- **Data Flow**: Journal files (YYYY-MM-DD.txt) → Reader → Analyzer → Service → CLI commands

### AI Integration (`src/ai/`)

- **Purpose**: LLM-powered note summarization using Anthropic Claude
- **Key Components**:
  - `AiService.ts` - Abstract AI service interface and factory
  - `AnthropicAiService.ts` - Anthropic Claude implementation
  - `NoteGatherer.ts` - Collects notes from multiple sources
  - `NoteSummarizer.ts` - Orchestrates AI-powered summarization
  - `PromptService.ts` - Manages prompt templates
- **Data Flow**: Client notes → Gatherer → Summarizer → AI Service → Output

### Configuration System

- **File**: `src/Config.ts`
- **Format**: TOML configuration files (`.productivity-cli.toml`)
- **Features**: Client definitions, AI settings, file path patterns, work day classification
- **Command**: `productivity-cli init` generates template configuration

### CLI Interface (`src/index.ts`)

Uses `yargs` for command-line interface with commands:

- `today/day/week/month` - Time reporting
- `summarize` - AI-powered note summarization
- `init` - Configuration file generation

## File Organization

Journal files follow strict naming: `<journal_root>/<year>/<YYYY-MM-DD>.txt`

Time entries use format: `HH:MM ClientID:ProjectID:ActivityID arbitrary notes`

Client notes use configurable file patterns with placeholders: `{year}`, `{month}`, `{day}`

## Key Dependencies

- **Runtime**: Bun (JavaScript runtime and package manager)
- **CLI**: yargs for argument parsing
- **Config**: toml parser for configuration files
- **AI**: @anthropic-ai/sdk for Claude integration
- **Testing**: Jest with TypeScript support
- **Code Quality**: ESLint, Prettier, Husky for git hooks

## Development Notes

The codebase uses dependency injection patterns, particularly in service constructors that accept configuration objects. When modifying AI or journal functionality, follow the existing service layer abstractions.

Test resources in `testResource/` provide realistic data for development and testing scenarios.

- When drafting a commit message, use the semantic commit message format as descibed at https://gist.github.com/joshbuchea/6f47e86d2510bce28f8e7f42ae84c716

- Refer to the @REQUIREMENTS.md file for the project's requirements.

- When implementing a new feature, make any necessary changes to @REQUIREMENT.md to reflect any introduced changes