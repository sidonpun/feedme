var builder = DistributedApplication.CreateBuilder(args);

builder.AddProject<Projects.feedme_Server>("feedme-server");

builder.Build().Run();
