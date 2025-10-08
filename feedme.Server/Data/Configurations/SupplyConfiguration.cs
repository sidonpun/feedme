using feedme.Server.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace feedme.Server.Data.Configurations;

public class SupplyConfiguration : IEntityTypeConfiguration<Supply>
{
    public void Configure(EntityTypeBuilder<Supply> builder)
    {
        builder.ToTable("supplies");

        builder.HasKey(supply => supply.Id);

        builder.Property(supply => supply.Id)
            .HasColumnName("id")
            .HasMaxLength(36)
            .ValueGeneratedNever();

        builder.Property(supply => supply.DocumentNumber)
            .HasColumnName("document_number")
            .HasMaxLength(32)
            .IsRequired();

        builder.HasIndex(supply => supply.DocumentNumber)
            .IsUnique();

        builder.Property(supply => supply.CatalogItemId)
            .HasColumnName("catalog_item_id")
            .HasMaxLength(36)
            .IsRequired();

        builder.HasOne(supply => supply.CatalogItem)
            .WithMany()
            .HasForeignKey(supply => supply.CatalogItemId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(supply => supply.Quantity)
            .HasColumnName("quantity")
            .HasColumnType("numeric(18,3)")
            .IsRequired();

        builder.Property(supply => supply.ArrivalDate)
            .HasColumnName("arrival_date")
            .HasColumnType("date")
            .IsRequired();

        builder.Property(supply => supply.ExpiryDate)
            .HasColumnName("expiry_date")
            .HasColumnType("date");

        builder.Property(supply => supply.Warehouse)
            .HasColumnName("warehouse")
            .HasMaxLength(128)
            .IsRequired();

        builder.Property(supply => supply.Responsible)
            .HasColumnName("responsible")
            .HasMaxLength(128)
            .IsRequired();

        builder.Property(supply => supply.Status)
            .HasColumnName("status")
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(supply => supply.CreatedAt)
            .HasColumnName("created_at")
            .HasColumnType("timestamp with time zone")
            .IsRequired();

        builder.HasIndex(supply => supply.ArrivalDate);
        builder.HasIndex(supply => supply.CreatedAt);
    }
}
