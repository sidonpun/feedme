using feedme.Server.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace feedme.Server.Data.Configurations;

public class InventoryDocumentConfiguration : IEntityTypeConfiguration<InventoryDocument>
{
    public void Configure(EntityTypeBuilder<InventoryDocument> builder)
    {
        builder.ToTable("inventory_documents");

        builder.HasKey(document => document.Id);

        builder.Property(document => document.Id)
            .HasColumnName("id")
            .HasMaxLength(36)
            .ValueGeneratedNever();

        builder.Property(document => document.Number)
            .HasColumnName("number")
            .HasMaxLength(64)
            .IsRequired();

        builder.Property(document => document.Warehouse)
            .HasColumnName("warehouse")
            .HasMaxLength(128)
            .IsRequired();

        builder.Property(document => document.Responsible)
            .HasColumnName("responsible")
            .HasMaxLength(128);

        builder.Property(document => document.StartedAt)
            .HasColumnName("started_at")
            .IsRequired();

        builder.Property(document => document.CompletedAt)
            .HasColumnName("completed_at");

        builder.Property(document => document.Status)
            .HasColumnName("status")
            .HasMaxLength(32)
            .IsRequired();

        builder.Navigation(document => document.Items).AutoInclude();

        builder.OwnsMany(document => document.Items, items =>
        {
            items.ToTable("inventory_lines");

            items.WithOwner()
                .HasForeignKey("inventory_document_id");

            items.Property<string>("inventory_document_id")
                .HasColumnName("inventory_document_id")
                .HasMaxLength(36)
                .IsRequired();

            items.Property<int>("Id")
                .HasColumnName("id")
                .ValueGeneratedOnAdd();

            items.HasKey("inventory_document_id", "Id");

            items.Property(line => line.CatalogItemId)
                .HasColumnName("catalog_item_id")
                .HasMaxLength(64)
                .IsRequired();

            items.Property(line => line.Sku)
                .HasColumnName("sku")
                .HasMaxLength(64)
                .IsRequired();

            items.Property(line => line.ItemName)
                .HasColumnName("item_name")
                .HasMaxLength(128)
                .IsRequired();

            items.Property(line => line.Category)
                .HasColumnName("category")
                .HasMaxLength(128)
                .IsRequired();

            items.Property(line => line.ExpectedQuantity)
                .HasColumnName("expected_quantity")
                .HasPrecision(18, 4)
                .IsRequired();

            items.Property(line => line.CountedQuantity)
                .HasColumnName("counted_quantity")
                .HasPrecision(18, 4)
                .IsRequired();

            items.Property(line => line.Unit)
                .HasColumnName("unit")
                .HasMaxLength(32)
                .IsRequired();

            items.Property(line => line.UnitPrice)
                .HasColumnName("unit_price")
                .HasPrecision(18, 4)
                .IsRequired();

            items.Ignore(line => line.DifferenceQuantity);
            items.Ignore(line => line.ExpectedCost);
            items.Ignore(line => line.CountedCost);
            items.Ignore(line => line.DifferenceCost);

            items.HasIndex("inventory_document_id");
        });
    }
}
