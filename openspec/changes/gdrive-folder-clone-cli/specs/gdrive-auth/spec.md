## ADDED Requirements

### Requirement: Desktop App OAuth Flow
The application MUST implement the Device Authorization Flow (or fallback to Local Loopback) to obtain Google Drive API access tokens securely and ephemerally, ensuring the files are generated on behalf of the user so their personal storage quota is utilized. The user MUST provide standard OAuth Client ID and Secret (`credentials.json` or environment variables) as input.

#### Scenario: User authenticates via Device Flow
- **WHEN** the CLI starts and no valid token is present in memory
- **THEN** it generates a user code and prompts the user to visit a Google verification URL (e.g., `google.com/device`) in any browser to enter the code
- **AND** polls Google's token endpoint until the user grants permission and an access token is returned

#### Scenario: Token retrieval
- **WHEN** the user authorizes the application in the browser
- **THEN** the CLI receives the access token, stores it in memory, and seamlessly proceeds with execution

### Requirement: Ephemeral Token Storage
Tokens MUST NOT be permanently saved to disk to ensure security and to compel the user to re-authenticate per session, aligning with the two-step ownership transfer workflow.

#### Scenario: Re-running the CLI
- **WHEN** the user executes the CLI again after completing a previous run
- **THEN** they must re-authenticate, as no previous session state was persisted
