# feedme.Server

## Running the backend locally

### Recommended: run with the Aspire app host

1. Install the .NET 9.0 SDK together with the Aspire workload.
2. From the repository root run:
   ```bash
   dotnet run --project feedme.AppHost
   ```
   The app host provisions PostgreSQL 16, creates the `WarehouseDb` database and wires the backend to it automatically.

### Alternative: start the API without PostgreSQL

Use the dedicated launch profile that switches Entity Framework Core to the in-memory provider:

```bash
dotnet run --project feedme.Server --launch-profile inmemory
```

The `inmemory` profile sets the `Database__Provider` environment variable for you, so the backend skips the PostgreSQL connection and boots with an in-memory data store. This option is useful when you only need to test the API surface without persisting data between restarts.

### Running against your own PostgreSQL instance

If you already maintain a PostgreSQL instance, update the `ConnectionStrings__WarehouseDb` environment variable (or `appsettings.Development.json`) with the correct connection string:

```bash
export ConnectionStrings__WarehouseDb="Host=localhost;Port=5432;Database=feedme_dev;Username=postgres;Password=postgres"
```

Launch the API using the default profile once the database is reachable:

```bash
dotnet run --project feedme.Server --launch-profile http
```

Entity Framework Core migrations run automatically on startup for relational providers, so the database schema stays current.
