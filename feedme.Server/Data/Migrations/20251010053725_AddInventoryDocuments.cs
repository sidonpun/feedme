using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace feedme.Server.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddInventoryDocuments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "inventory_documents",
                columns: table => new
                {
                    id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    number = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    warehouse = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    responsible = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    started_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    completed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_inventory_documents", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "inventory_lines",
                columns: table => new
                {
                    inventory_document_id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    catalog_item_id = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    sku = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    item_name = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    category = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    expected_quantity = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false),
                    counted_quantity = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false),
                    unit = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    unit_price = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_inventory_lines", x => new { x.inventory_document_id, x.id });
                    table.ForeignKey(
                        name: "FK_inventory_lines_inventory_documents_inventory_document_id",
                        column: x => x.inventory_document_id,
                        principalTable: "inventory_documents",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_inventory_lines_inventory_document_id",
                table: "inventory_lines",
                column: "inventory_document_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "inventory_lines");

            migrationBuilder.DropTable(
                name: "inventory_documents");
        }
    }
}
