# Google Drive Folder Cloner

A Node.js CLI tool to recursively clone Google Drive folders. This tool allows you to duplicate entire directory structures and files within Google Drive, which is particularly useful for taking true ownership of files shared from another account.

## Overview

When you copy a file in Google Drive, the account that performs the copy becomes the owner of the new file, and the file consumes their storage quota. This CLI tool automates the tedious process of recursively copying deep folder structures, providing a live progress bar, file preview, and utilizing a clean Device Authorization flow for authentication.

## General Usage

You can install the tool globally or run it via a package manager.

### Installation

```bash
# Clone the repository and install globally
pnpm install -g .
```

### Command

```bash
gdrive-clone --source <source-folder-id-or-name> --dest <destination-folder-id-or-name>
```

**Options:**
- `--source <id|name>`: (Required) The ID or name of the folder you want to copy.
- `--dest <id|name>`: (Required) The ID or name of the destination folder where the copy will be placed.
- `--share-with <email>`: (Optional) Email address to automatically share the newly cloned folder with.
- `-y`, `--yolo`: (Optional) Bypass the interactive preview and confirmation prompt, starting the cloning process immediately.

**Example:**
```bash
gdrive-clone --source "Shared Projects" --dest "My Drive/Backups" --share-with colleague@example.com
```

### Flow
1. **Authentication:** The tool will prompt you to visit `google.com/device` and enter a code to authenticate securely.
2. **Ambiguity Resolution:** If a folder name matches multiple locations (e.g. "Projects"), you'll be prompted to select the exact path.
3. **Pre-scan & Preview:** It performs a lightweight scan of the source directory, counts the total files/folders, and displays a truncated preview.
4. **Confirmation:** Unless the `-y` flag is passed, you will be asked to confirm the operation.
5. **Cloning:** A live progress bar will track the recursive duplication of all files and folders.

## Two-Step File Transfer (Ownership Consolidation)

This tool is designed to solve the common problem of transferring ownership between accounts where direct transfer is restricted (e.g., between different Google Workspace domains).

To fully transfer ownership of a folder from **Account A** to **Account B**:

**Step 1: Share the Source Folder**
From Account A, share the target Google Drive folder with Account B, granting them at least "Viewer" access.

**Step 2: Clone as the Destination Account**
Run the CLI tool and authenticate using **Account B**. Provide the ID/name of the shared folder as the `--source`, and a folder ID/name owned by Account B as the `--dest`.

Because Account B performs the copy operations, Account B becomes the true, permanent owner of the duplicated files. The copies will consume Account B's storage quota, and the original files in Account A remain untouched.
