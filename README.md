# Feedme

This repository contains a .NET backend and an Angular frontend located in `feedme.client`.

## Installation

1. Ensure Node.js (>=16) and npm (>=8) are installed.
2. Run `./install.sh` from the repository root. This installs dependencies and builds the Angular client.
3. To start the dev server automatically, pass `--start`:
   ```bash
   ./install.sh --start
   ```

## Commands

After installation, the common Angular tasks can be run from the repository root:

```bash
npm run build   # Builds the Angular client
npm run test    # Runs unit tests (requires a local Chrome)
```
