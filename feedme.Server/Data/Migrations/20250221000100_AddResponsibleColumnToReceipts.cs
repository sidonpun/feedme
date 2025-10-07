using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace feedme.Server.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddResponsibleColumnToReceipts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "responsible",
                table: "receipts",
                type: "character varying(128)",
                maxLength: 128,
                nullable: false,
                defaultValue: "Не назначен");

            migrationBuilder.AlterColumn<string>(
                name: "responsible",
                table: "receipts",
                type: "character varying(128)",
                maxLength: 128,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(128)",
                oldMaxLength: 128,
                oldDefaultValue: "Не назначен");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "responsible",
                table: "receipts");
        }
    }
}
