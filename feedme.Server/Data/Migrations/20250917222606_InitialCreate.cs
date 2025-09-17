using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace feedme.Server.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "catalog_items",
                columns: table => new
                {
                    id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    type = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    code = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    category = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    unit = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    weight = table.Column<double>(type: "double precision", nullable: false),
                    writeoff_method = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    allergens = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: false),
                    packaging_required = table.Column<bool>(type: "boolean", nullable: false),
                    spoils_after_opening = table.Column<bool>(type: "boolean", nullable: false),
                    supplier = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    delivery_time = table.Column<int>(type: "integer", nullable: false),
                    cost_estimate = table.Column<double>(type: "double precision", nullable: false),
                    tax_rate = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    unit_price = table.Column<double>(type: "double precision", nullable: false),
                    sale_price = table.Column<double>(type: "double precision", nullable: false),
                    tnved = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    is_marked = table.Column<bool>(type: "boolean", nullable: false),
                    is_alcohol = table.Column<bool>(type: "boolean", nullable: false),
                    alcohol_code = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    alcohol_strength = table.Column<double>(type: "double precision", nullable: false),
                    alcohol_volume = table.Column<double>(type: "double precision", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_catalog_items", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "receipts",
                columns: table => new
                {
                    id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    number = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    supplier = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    warehouse = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    received_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_receipts", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "receipt_lines",
                columns: table => new
                {
                    receipt_id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    catalog_item_id = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    item_name = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    quantity = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false),
                    unit = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    unit_price = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_receipt_lines", x => new { x.receipt_id, x.id });
                    table.ForeignKey(
                        name: "FK_receipt_lines_receipts_receipt_id",
                        column: x => x.receipt_id,
                        principalTable: "receipts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_receipt_lines_receipt_id",
                table: "receipt_lines",
                column: "receipt_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "catalog_items");

            migrationBuilder.DropTable(
                name: "receipt_lines");

            migrationBuilder.DropTable(
                name: "receipts");
        }
    }
}
