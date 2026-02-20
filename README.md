# Google Drive Folder Cloner CLI

A Node.js CLI tool for recursively cloning Google Drive folder hierarchies server-side. This solves the problem of file ownership transfer between Google accounts by providing a risk-free, two-step workflow for consolidating ownership without modifying or moving original files.

## Features

- **Server-side duplication**: Uses Drive API `files.copy` so files aren't downloaded and uploaded, and explicitly overrides the "Copy of " prefix.
- **Interactive Prompts**: If your source folder name is ambiguous, the CLI will ask you to select the correct path.
- **Preview**: See a truncated list of files before confirming the clone.
- **Ephemeral Authentication**: Uses the Google Device Authorization Flow to keep credentials safe and ephemeral.
- **Auto-sharing**: Optionally share the cloned destination folder with another Google account right away.

## Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project.
3. Navigate to **APIs & Services > Library** and enable the **Google Drive API**.
4. Navigate to **APIs & Services > OAuth consent screen** and configure it for **Desktop app** (External or Internal).
5. Navigate to **APIs & Services > Credentials**.
6. Click **Create Credentials > OAuth client ID**.
7. Select **Desktop app** as the application type.
8. Download the JSON file and save it as `credentials.json` in the directory from which you run the CLI.

## Installation

You can install this CLI globally using `npm` or `pnpm`:

```bash
# Build the project first
pnpm install
pnpm build

# Install globally
pnpm install -g .
```

## Usage

Run the CLI using the `gdclone` command (or `pnpm dev` for local execution):

```bash
# Basic usage (prompts for confirmation)
gdclone "My Source Folder" "My Cloned Folder"

# Using a specific Google Drive Folder ID
gdclone "1aBcD2eFgH3iJkL4mNoP5qRsT6uVwXyZ7" "My Cloned Folder"

# Auto-share the cloned folder with another account (Editor access)
gdclone "My Source Folder" "My Cloned Folder" --share-with "user@example.com"

# Skip confirmation prompts (YOLO mode)
gdclone "My Source Folder" "My Cloned Folder" -y
```

### Authentication

When you run the tool for the first time in a session, it will output a verification URL and a code:

```
Please visit this URL: https://www.google.com/device
And enter the following code: ABCD-EFGH
```

Open the URL in any browser, log into the Google account that _owns_ the destination quota, and enter the code. The CLI will automatically resume once access is granted.
