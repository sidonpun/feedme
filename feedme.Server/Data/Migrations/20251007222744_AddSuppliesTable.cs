using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace feedme.Server.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddSuppliesTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateSequence<long>(
                name: "supplies_document_number_seq");

            migrationBuilder.CreateTable(
                name: "supplies",
                columns: table => new
                {
                    id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    document_number = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    catalog_item_id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    quantity = table.Column<decimal>(type: "numeric(18,3)", nullable: false),
                    arrival_date = table.Column<DateTime>(type: "date", nullable: false),
                    expiry_date = table.Column<DateTime>(type: "date", nullable: true),
                    warehouse = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    responsible = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_supplies", x => x.id);
                    table.ForeignKey(
                        name: "FK_supplies_catalog_items_catalog_item_id",
                        column: x => x.catalog_item_id,
                        principalTable: "catalog_items",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_supplies_arrival_date",
                table: "supplies",
                column: "arrival_date");

            migrationBuilder.CreateIndex(
                name: "IX_supplies_catalog_item_id",
                table: "supplies",
                column: "catalog_item_id");

            migrationBuilder.CreateIndex(
                name: "IX_supplies_created_at",
                table: "supplies",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "IX_supplies_document_number",
                table: "supplies",
                column: "document_number",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "supplies");

            migrationBuilder.DropSequence(
                name: "supplies_document_number_seq");
        }
    }
}
