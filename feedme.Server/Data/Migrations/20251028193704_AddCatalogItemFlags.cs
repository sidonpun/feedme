using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace feedme.Server.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCatalogItemFlags : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "catalog_item_flags",
                columns: table => new
                {
                    catalog_item_id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    flag_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_catalog_item_flags", x => new { x.catalog_item_id, x.flag_id });
                    table.ForeignKey(
                        name: "FK_catalog_item_flags_catalog_items_catalog_item_id",
                        column: x => x.catalog_item_id,
                        principalTable: "catalog_items",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_catalog_item_flags_product_flags_flag_id",
                        column: x => x.flag_id,
                        principalTable: "product_flags",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_catalog_item_flags_flag_id",
                table: "catalog_item_flags",
                column: "flag_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "catalog_item_flags");
        }
    }
}
