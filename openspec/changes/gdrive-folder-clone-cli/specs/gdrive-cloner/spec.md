## ADDED Requirements

### Requirement: Recursive Folder Copy
The application MUST recursively copy all files and subdirectories from a given source Google Drive folder ID to a new destination folder.

#### Scenario: Copying a deep hierarchy
- **WHEN** the `<source>` folder contains subdirectories and files
- **THEN** the CLI creates the new destination folder, recursively traverses the source, creates matching subdirectories in the destination, and duplicates all files server-side

### Requirement: Server-Side Duplication without "Copy of" Prefix
The application MUST utilize the Google Drive API `files.copy` method and explicitly set the file name in the request body to match the source file's name.

#### Scenario: Copying a single file
- **WHEN** a file named "Annual Report.pdf" is copied
- **THEN** the API creates a duplicate named exactly "Annual Report.pdf" in the new destination folder, not "Copy of Annual Report.pdf"

### Requirement: Sharing the Destination Folder
If a `--share-with` email is provided, the application MUST grant "Editor" (write) access to that email address on the newly created root destination folder.

#### Scenario: Granting access to User B
- **WHEN** the `--share-with "userB@example.com"` argument is provided
- **THEN** the CLI calls the Google Drive Permissions API on the new destination folder to grant `writer` role to the given email address

### Requirement: Quota and Rate Limit Handling
The application MUST process files sequentially or with limited concurrency to handle API rate limits and accurately report errors like `403 Insufficient Storage Quota`.

#### Scenario: Encountering quota exhaustion
- **WHEN** the user running the CLI hits their Google Drive storage limit
- **THEN** the CLI stops execution, reports a clear error about quota exhaustion, and exits gracefully
