using Aspire.Hosting;
using feedme.AppHost;

AspireEndpointPortAllocator.EnsureRequiredPortsAreAvailable();

var builder = DistributedApplication.CreateBuilder(args);

var postgres = builder.AddPostgres("postgres")
    .WithImageTag("16-alpine")
    .WithDataVolume();

var warehouseDb = postgres.AddDatabase("WarehouseDb");

builder.AddProject<Projects.feedme_Server>("feedme-server")
    .WithReference(warehouseDb);

builder.Build().Run();
