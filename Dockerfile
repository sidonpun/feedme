WORKDIR /client

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS server-build
WORKDIR /src
RUN dotnet restore feedme.Server/feedme.Server.csproj
RUN dotnet publish feedme.Server/feedme.Server.csproj -c Release -o /out /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=server-build /out ./
# ������� Angular ����� � wwwroot (������ ������ ��������� �������)
COPY --from=client-build /client/dist/ /app/wwwroot/
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
