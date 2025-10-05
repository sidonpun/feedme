using System.Collections;
using System.ComponentModel.DataAnnotations;

namespace feedme.Server.Infrastructure.Validation;

/// <summary>
/// Ensures that a collection parameter or property does not contain <c>null</c> elements.
/// </summary>
[AttributeUsage(AttributeTargets.Property | AttributeTargets.Parameter)]
public sealed class EnsureCollectionElementsNotNullAttribute : ValidationAttribute
{
    private const string DefaultErrorMessage = "Collection elements cannot be null.";

    public EnsureCollectionElementsNotNullAttribute()
        : base(DefaultErrorMessage)
    {
    }

    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        if (value is null)
        {
            return ValidationResult.Success;
        }

        if (value is not IEnumerable collection)
        {
            return new ValidationResult(
                ErrorMessage,
                validationContext.MemberName is null
                    ? null
                    : new[] { validationContext.MemberName });
        }

        foreach (var element in collection)
        {
            if (element is null)
            {
                return new ValidationResult(
                    ErrorMessage,
                    validationContext.MemberName is null
                        ? null
                        : new[] { validationContext.MemberName });
            }
        }

        return ValidationResult.Success;
    }
}
