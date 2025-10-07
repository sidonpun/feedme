using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace feedme.Server.Data.Migrations
{
    /// <inheritdoc />
    public partial class EnsureResponsibleColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                ALTER TABLE receipts
                ADD COLUMN IF NOT EXISTS responsible character varying(128);
                """);

            migrationBuilder.Sql(
                """
                ALTER TABLE receipts
                ALTER COLUMN responsible TYPE character varying(128);
                """);

            migrationBuilder.Sql(
                """
                UPDATE receipts
                SET responsible = 'Не назначен'
                WHERE responsible IS NULL
                   OR BTRIM(responsible) = '';
                """);

            migrationBuilder.Sql(
                """
                ALTER TABLE receipts
                ALTER COLUMN responsible SET NOT NULL;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                ALTER TABLE receipts
                DROP COLUMN IF EXISTS responsible;
                """);
        }
    }
}
