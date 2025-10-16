using System;
using feedme.Server.Data.Seed;
using feedme.Server.Models;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace feedme.Server.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddProductFlagsDictionary : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "product_flags",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    code = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    name = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_product_flags", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_product_flags_code",
                table: "product_flags",
                column: "code",
                unique: true);

            foreach (var flag in ProductFlagSeedData.Flags)
            {
                var id = Guid.NewGuid();
                var escapedName = (flag.Name ?? string.Empty).Replace("'", "''");

                migrationBuilder.Sql($"""
                    INSERT INTO product_flags (id, code, name, is_active)
                    VALUES ('{id}', '{flag.Code}', '{escapedName}', true)
                    ON CONFLICT (code) DO NOTHING;
                    """);
            }
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "product_flags");
        }
    }
}
