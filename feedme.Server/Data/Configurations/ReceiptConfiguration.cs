using feedme.Server.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace feedme.Server.Data.Configurations;

public class ReceiptConfiguration : IEntityTypeConfiguration<Receipt>
{
    public void Configure(EntityTypeBuilder<Receipt> builder)
    {
        builder.ToTable("receipts");

        builder.HasKey(receipt => receipt.Id);

        builder.Property(receipt => receipt.Id)
            .HasColumnName("id")
            .HasMaxLength(36)
            .ValueGeneratedNever();

        builder.Property(receipt => receipt.Number)
            .HasColumnName("number")
            .HasMaxLength(64)
            .IsRequired();

        builder.Property(receipt => receipt.Supplier)
            .HasColumnName("supplier")
            .HasMaxLength(128)
            .IsRequired();

        builder.Property(receipt => receipt.Warehouse)
            .HasColumnName("warehouse")
            .HasMaxLength(128);

        builder.Property(receipt => receipt.ReceivedAt)
            .HasColumnName("received_at")
            .IsRequired();

        builder.Navigation(receipt => receipt.Items).AutoInclude();

        builder.OwnsMany(receipt => receipt.Items, items =>
        {
            items.ToTable("receipt_lines");

            items.WithOwner()
                .HasForeignKey("receipt_id");

            items.Property<string>("receipt_id")
                .HasColumnName("receipt_id")
                .HasMaxLength(36)
                .IsRequired();

            items.Property<int>("Id")
                .HasColumnName("id")
                .ValueGeneratedOnAdd();

            items.HasKey("receipt_id", "Id");

            items.Property(line => line.CatalogItemId)
                .HasColumnName("catalog_item_id")
                .HasMaxLength(64)
                .IsRequired();

            items.Property(line => line.ItemName)
                .HasColumnName("item_name")
                .HasMaxLength(128)
                .IsRequired();

            items.Property(line => line.Quantity)
                .HasColumnName("quantity")
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

            items.Ignore(line => line.TotalCost);

            items.HasIndex("receipt_id");
        });
    }
}
