## 1. Project Setup

- [x] 1.1 Initialize a new Node.js project with TypeScript config (tsconfig.json, package.json).
- [x] 1.2 Add `bin` mapping to `package.json` to make the CLI globally installable.
- [x] 1.3 Install required dependencies (`googleapis`, `commander`, `prompts`, `dotenv` for credentials loading).
- [x] 1.4 Setup ESLint/Prettier based on project conventions in AGENTS.md.

## 2. Authentication (Device Flow)

- [x] 2.1 Outline Google Cloud Console Project setup instructions in README for users to generate `credentials.json`.
- [x] 2.2 Create `src/auth.ts` to implement the Google Device Authorization Flow.
- [x] 2.3 Implement the polling logic to exchange the device code for an ephemeral token once user grants access.
- [x] 2.4 Instantiate the `googleapis` drive client with the obtained ephemeral token.

## 3. CLI Argument Parsing & Folder Resolution

- [x] 3.1 Setup `commander` in `src/cli.ts` to parse `<source>`, `<dest>`, `--share-with`, and `-y`/`--yolo` arguments.
- [x] 3.2 Implement a folder search function in `src/drive.ts` using `drive.files.list` with query `mimeType='application/vnd.google-apps.folder' and name='${source}'`.
- [x] 3.3 Add path resolution logic to fetch the full path of any matched folders.
- [x] 3.4 Integrate `prompts` to ask the user to select the correct path if multiple folders are found.
- [x] 3.5 Fetch a truncated list of files inside the resolved `<source>` directory and print them to the console.
- [x] 3.6 Prompt the user `Are you sure you want to clone <Source> to <Dest>? [y/N]` unless the `-y`/`--yolo` flag is provided.

## 4. Folder Cloning & File Duplication

- [x] 4.1 Implement `createFolder` function to create the root destination directory.
- [x] 4.2 Implement recursive depth-first traversal of the source folder structure.
- [x] 4.3 Add `files.copy` logic explicitly providing the source file name in the request body.
- [x] 4.4 Add simple sequential processing or concurrency limiting to prevent rate limiting errors and handle `403 Insufficient Quota`.

## 5. Permissions (Sharing)

- [x] 5.1 Implement `shareFolder` function to grant `writer` (Editor) access to the `--share-with` email using the Drive Permissions API.
- [x] 5.2 Integrate the sharing step to occur immediately after the root destination folder is created.

## 6. Polishing and Documentation

- [x] 6.1 Incorporate a progress indicator (e.g., `cli-progress` or `ora`) to display the current file being copied and the overall copy completion percentage.
- [x] 6.2 Implement an initial pre-scan function (before cloning) to count the total number of files/folders required for the progress percentage calculation.
- [x] 6.3 Update the main README with setup instructions and usage examples matching the SPEC.md.
