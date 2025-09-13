# ---------- 1) Angular client ----------
FROM node:20-bullseye AS client-build
WORKDIR /build
COPY package.json package-lock.json ./
COPY feedme.client ./feedme.client
RUN npm ci --no-audit --no-fund
RUN npm exec --workspace feedme.client ng build --configuration=production --output-path=/client/dist

# ---------- 2) .NET server + ServiceDefaults ----------
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS server-build
WORKDIR /src
COPY feedme.ServiceDefaults/*.csproj feedme.ServiceDefaults/
COPY feedme.Server/*.csproj feedme.Server/
RUN dotnet restore feedme.Server/feedme.Server.csproj
COPY feedme.ServiceDefaults/ feedme.ServiceDefaults/
COPY feedme.Server/ feedme.Server/
RUN dotnet publish feedme.Server/feedme.Server.csproj -c Release -o /out /p:UseAppHost=false

# ---------- 3) Final image ----------
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=server-build /out ./
COPY --from=client-build /client/dist ./wwwroot
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet","feedme.Server.dll"]
