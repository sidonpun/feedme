# FeedMe

## Required .NET SDK Preview

The backend projects in this repository (`feedme.Server`, `feedme.AppHost`, and `feedme.Server.Tests`) target the .NET 9 preview toolchain. Install the **.NET SDK 9.0 (preview)** before running any `dotnet` commands for these projects to avoid build or restore errors.

### Install the preview SDK
1. Visit the official [.NET 9 preview downloads page](https://dotnet.microsoft.com/en-us/download/dotnet/9.0) and choose the SDK installer for your operating system.
2. Run the installer and follow the on-screen instructions to complete the installation.
3. Restart your shell or IDE so it picks up the newly installed SDK.

### Verify the installation
After installing, confirm the preview SDK is available by running:

```bash
dotnet --list-sdks
```

Look for an entry that starts with `9.0.100-preview`. If it appears, the correct SDK is ready for use.

### Automatic SDK selection
This repository includes a [`global.json`](./global.json) file pinned to version `9.0.100-preview`. Once the preview SDK is installed, the .NET CLI automatically selects it when you work with the solution, ensuring consistent builds across environments.
