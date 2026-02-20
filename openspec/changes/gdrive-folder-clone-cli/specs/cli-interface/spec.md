## ADDED Requirements

### Requirement: Global Installation
The project MUST define a `bin` entry in `package.json` so it can be installed globally or locally as a command-line application using package managers like `npm`, `yarn`, or `pnpm`.

#### Scenario: Installing the CLI
- **WHEN** a user runs `pnpm install -g .`
- **THEN** they can invoke the tool directly from their terminal using a defined command (e.g., `gdrive-clone`)

### Requirement: CLI Arguments Parsing
The CLI MUST accept and parse required and optional command-line arguments to drive the folder cloning process.

#### Scenario: User provides all arguments
- **WHEN** the CLI is executed with `<source>`, `<dest>`, `--share-with`, and `-y`/`--yolo` arguments
- **THEN** it parses these values correctly and initiates the appropriate workflow without error

#### Scenario: User provides required arguments only
- **WHEN** the CLI is executed with `<source>` and `<dest>` but omits `--share-with`
- **THEN** it parses the values and proceeds, keeping the new destination folder private to the authenticated user

### Requirement: Directory Preview and Confirmation
Before executing any write operations, the CLI MUST output a truncated list of files and subdirectories found inside the resolved `<source>` directory, and wait for the user to explicitly confirm they want to proceed.

#### Scenario: User confirms the operation
- **WHEN** the source is resolved and the preview is shown
- **THEN** the CLI asks `Are you sure you want to clone <Source> to <Dest>? [y/N]`
- **AND** only proceeds if the user answers affirmatively

### Requirement: Yolo Mode
If the `-y` or `--yolo` flag is provided at runtime, the CLI MUST skip the interactive confirmation prompt, immediately executing the copy operation after resolving the source path.

#### Scenario: Yolo flag is passed
- **WHEN** the CLI is executed with the `-y` flag
- **THEN** it displays the preview of files but DOES NOT pause to ask `Are you sure?`, proceeding straight to the cloning phase

### Requirement: Interactive Folder Selection
When the `<source>` argument matches multiple Google Drive folders, the CLI MUST prompt the user interactively to select the correct folder path to prevent ambiguity.

#### Scenario: Ambiguous source folder name
- **WHEN** the `<source>` "Projects" matches "My Drive/Projects" and "Shared Drives/Projects"
- **THEN** the CLI lists all matched full paths and waits for the user to select exactly one before proceeding

### Requirement: Execution Feedback
The CLI MUST provide a live progress indicator during the copy process. This includes displaying the current file being copied and, ideally, a percentage of completion.

#### Scenario: Visual progress indication
- **WHEN** a folder is being recursively copied
- **THEN** the console updates a progress bar (or status line) showing the currently copying file's name and the overall progress percentage
