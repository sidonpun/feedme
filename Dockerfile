WORKDIR /client

COPY feedme.client/package*.json ./
RUN npm ci --no-audit --no-fund
COPY feedme.client/ ./
RUN npx -y @angular/cli@19 build --configuration=production --project=feedme --output-path=/client/dist


FROM mcr.microsoft.com/dotnet/sdk:9.0 AS server-build
WORKDIR /src
RUN dotnet restore feedme.Server/feedme.Server.csproj
RUN dotnet publish feedme.Server/feedme.Server.csproj -c Release -o /out /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=server-build /out ./
COPY --from=client-build /client/dist/ /app/wwwroot/
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
