using feedme.Server.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace feedme.Server.Data.Configurations;

public class CatalogItemConfiguration : IEntityTypeConfiguration<CatalogItem>
{
    public void Configure(EntityTypeBuilder<CatalogItem> builder)
    {
        builder.ToTable("catalog_items");

        builder.HasKey(item => item.Id);

        builder.Property(item => item.Id)
            .HasColumnName("id")
            .HasMaxLength(36)
            .ValueGeneratedNever();

        builder.Property(item => item.Name)
            .HasColumnName("name")
            .HasMaxLength(256)
            .IsRequired();

        builder.Property(item => item.Type)
            .HasColumnName("type")
            .HasMaxLength(64)
            .IsRequired();

        builder.Property(item => item.Code)
            .HasColumnName("code")
            .HasMaxLength(64)
            .IsRequired();

        builder.Property(item => item.Category)
            .HasColumnName("category")
            .HasMaxLength(128)
            .IsRequired();

        builder.Property(item => item.Unit)
            .HasColumnName("unit")
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(item => item.Weight)
            .HasColumnName("weight");

        builder.Property(item => item.WriteoffMethod)
            .HasColumnName("writeoff_method")
            .HasMaxLength(128)
            .IsRequired();

        builder.Property(item => item.Allergens)
            .HasColumnName("allergens")
            .HasMaxLength(512);

        builder.Property(item => item.PackagingRequired)
            .HasColumnName("packaging_required");

        builder.Property(item => item.SpoilsAfterOpening)
            .HasColumnName("spoils_after_opening");

        builder.Property(item => item.Supplier)
            .HasColumnName("supplier")
            .HasMaxLength(128)
            .IsRequired();

        builder.Property(item => item.DeliveryTime)
            .HasColumnName("delivery_time");

        builder.Property(item => item.CostEstimate)
            .HasColumnName("cost_estimate");

        builder.Property(item => item.TaxRate)
            .HasColumnName("tax_rate")
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(item => item.UnitPrice)
            .HasColumnName("unit_price");

        builder.Property(item => item.SalePrice)
            .HasColumnName("sale_price");

        builder.Property(item => item.Tnved)
            .HasColumnName("tnved")
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(item => item.IsMarked)
            .HasColumnName("is_marked");

        builder.Property(item => item.IsAlcohol)
            .HasColumnName("is_alcohol");

        builder.Property(item => item.AlcoholCode)
            .HasColumnName("alcohol_code")
            .HasMaxLength(64);

        builder.Property(item => item.AlcoholStrength)
            .HasColumnName("alcohol_strength");

        builder.Property(item => item.AlcoholVolume)
            .HasColumnName("alcohol_volume");
    }
}
