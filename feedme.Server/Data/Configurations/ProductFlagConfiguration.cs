using feedme.Server.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace feedme.Server.Data.Configurations;

public class ProductFlagConfiguration : IEntityTypeConfiguration<ProductFlag>
{
    public void Configure(EntityTypeBuilder<ProductFlag> builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.ToTable("product_flags");

        builder.HasKey(flag => flag.Id);

        builder.Property(flag => flag.Id)
            .HasColumnName("id");

        builder.Property(flag => flag.Code)
            .IsRequired()
            .HasMaxLength(64)
            .HasColumnName("code");

        builder.Property(flag => flag.Name)
            .IsRequired()
            .HasMaxLength(128)
            .HasColumnName("name");

        builder.Property(flag => flag.IsActive)
            .HasColumnName("is_active")
            .HasDefaultValue(true)
            .ValueGeneratedOnAdd();

        builder.Property(flag => flag.CreatedAt)
            .HasColumnName("created_at")
            .HasColumnType("timestamp with time zone")
            .HasDefaultValueSql("CURRENT_TIMESTAMP")
            .ValueGeneratedOnAdd();

        builder.HasIndex(flag => flag.Code)
            .IsUnique();
    }
}
