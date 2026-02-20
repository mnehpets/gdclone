## Why

Transferring file ownership between Google Drive accounts is currently complex and risky, often leading to scattered files or quota exhaustion. This tool solves this by providing a safe, scriptable way to clone folder hierarchies server-side, enabling a risk-free, two-step workflow for consolidating ownership without modifying or moving original files.

## What Changes

- Introduces a Node.js CLI tool for recursive Google Drive folder cloning.
- Implements the Desktop App OAuth flow (local loopback) for secure, ephemeral authentication without long-term credentials.
- Adds CLI parameters: <source> (folder name/ID), <dest> (new folder name), optional `--share-with` (email access), and `-y` or `--yolo` for skipping confirmation prompts.
- Implements server-side duplication via Drive API `files.copy`, explicitly overriding the "Copy of " prefix.
- Includes a directory confirmation step that previews a truncated list of source files before cloning (unless `-y` is provided).
- Ensures the tool is built as an installable CLI (via `pnpm` or `npm`) for global or local project usage.

## Capabilities

### New Capabilities
- `cli-interface`: Argument parsing, user prompts for path resolution, and console feedback.
- `gdrive-auth`: Implementation of the Desktop App OAuth (Local Loopback) flow to acquire temporary tokens.
- `gdrive-cloner`: Core Drive API logic for recursive folder traversal, folder creation, and server-side file duplication.

### Modified Capabilities
- (None)

## Impact

- Creates a new Node.js/TypeScript project hierarchy.
- Introduces dependencies on `googleapis` for Google Drive access and potentially CLI libraries (e.g., `commander`, `prompts`).
