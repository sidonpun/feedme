# См. статью по ссылке https://aka.ms/customizecontainer, чтобы узнать как настроить контейнер отладки и как Visual Studio использует этот Dockerfile для создания образов для ускорения отладки.

# В зависимости от операционной системы хост-компьютеров, которые будут выполнять сборку контейнеров или запускать их, может потребоваться изменить образ, указанный в инструкции FROM.
# Дополнительные сведения см. на странице https://aka.ms/containercompat

# Этот этап используется при запуске из VS в быстром режиме (по умолчанию для конфигурации отладки)
FROM mcr.microsoft.com/dotnet/aspnet:9.0-nanoserver-1809 AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

**/bin
**/obj
**/node_modules
.vs
.git

# ---------- 1) Сборка Angular-клиента ----------
FROM node:18-bullseye AS client-build
WORKDIR /client
COPY feedme.client/package*.json ./
RUN npm ci
COPY feedme.client/ .
# Выкладка в плоскую папку dist (чтобы copy был простым)
RUN npm run build -- --configuration production --output-path=dist

# ---------- 2) Сборка .NET сервера ----------
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS server-build
WORKDIR /src
COPY feedme.Server/*.csproj feedme.Server/
RUN dotnet restore feedme.Server/feedme.Server.csproj
COPY feedme.Server/ feedme.Server/
RUN dotnet publish feedme.Server/feedme.Server.csproj -c Release -o /out /p:UseAppHost=false

# ---------- 3) Финальный образ ----------
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=server-build /out ./
# Готовый Angular кладём в wwwroot (сервер должен раздавать статику)
COPY --from=client-build /client/dist/ /app/wwwroot/
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "feedme.Server.dll"]

