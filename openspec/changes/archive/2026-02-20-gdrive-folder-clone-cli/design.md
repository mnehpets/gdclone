## Context

The Google Drive Folder Cloner is a CLI application that solves the problem of file ownership transfer between Google accounts by duplicating a directory tree and sharing it with the target account. This tool requires a local, ephemeral OAuth strategy to keep authentication credentials safe and not stored persistently.

## Goals / Non-Goals

**Goals:**
- Provide a responsive CLI interface that accepts `<source>`, `<dest>`, `--share-with`, and `-y`/`--yolo` arguments.
- Safely query Google Drive and resolve folder paths correctly to avoid ambiguity (e.g., matching the correct "My Drive/Projects" out of several possible folders).
- Preview a sample of files inside the resolved `<source>` directory, confirming with the user before actually copying data.
- Ensure explicit file copying via `files.copy` so "Copy of " is not prepended to cloned files.
- Package the project as an installable CLI (`npm install -g .` or `npx`).

**Non-Goals:**
- Downloading file contents and uploading them back to Drive (this would be slow and consume bandwidth; we strictly use server-side `files.copy`).
- Permanently storing OAuth tokens.
- Deleting the source folder automatically.

## Decisions

**Node.js & TypeScript:** 
We will use TypeScript on Node.js. Node provides a mature ecosystem for CLI apps (`commander`, `prompts`) and the official `googleapis` package makes interfacing with the Drive API straightforward. We will configure `package.json` with a `bin` property to ensure the tool is globally installable via `pnpm install -g` or similar package managers.

**Local Loopback or Device Authorization Flow:**
For authentication, we will use an OAuth flow that keeps credentials ephemeral. The user will need to supply an OAuth Client ID/Secret (e.g., via `credentials.json` or `.env`), because authenticating as the actual user (instead of a Service Account) is mandatory to ensure the cloned files consume the user's storage quota rather than an isolated service quota. We will likely use the **Device Authorization Flow** (or fallback to Local Loopback) as it doesn't require spinning up a localhost server or configuring redirect URIs—it simply provides a code for the user to enter at `google.com/device` in any browser.

**Recursive Folder Copy Strategy & Progress Tracking:**
We will implement an asynchronous depth-first traversal of the Google Drive folder structure. For each directory, we create a corresponding new directory in the destination. For each file, we use `files.copy` and explicitly pass the original file's name in the request body to suppress the default "Copy of " prefix. To provide an accurate progress percentage, the tool will first execute a lightweight pre-scan (a recursive directory structure enumeration) to calculate the total number of files and folders to be copied before initiating the actual writes.

**API Rate Limiting & Concurrency:**
To prevent overwhelming the Google Drive API, we will employ a concurrency limiter (like `p-limit` or native Promise chunking) or simple sequential processing. A sequential approach ensures we don't hit 403 quota errors easily and provides linear console feedback.

## Risks / Trade-offs

- **Risk: Hitting API Rate Limits**
  - **Mitigation:** Implement exponential backoff for `googleapis` calls and limit concurrent requests.
- **Risk: Ambiguous Folder Names**
  - **Mitigation:** The CLI must present a list of matched folder paths if the `<source>` is not a unique ID or maps to multiple paths, prompting the user for confirmation.
- **Risk: Quota Exhaustion during the second step**
  - **Mitigation:** The user executing the final copy must have enough free storage. The CLI should gracefully handle `403 Insufficient Storage Quota` errors and inform the user.
