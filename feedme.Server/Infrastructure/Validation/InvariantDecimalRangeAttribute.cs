using System.ComponentModel.DataAnnotations;
using System.Globalization;

namespace feedme.Server.Infrastructure.Validation;

/// <summary>
/// Validates that a numeric value falls within a decimal range using invariant culture parsing.
/// </summary>
[AttributeUsage(AttributeTargets.Property | AttributeTargets.Parameter)]
public sealed class InvariantDecimalRangeAttribute : ValidationAttribute
{
    private static readonly CultureInfo InvariantCulture = CultureInfo.InvariantCulture;

    public InvariantDecimalRangeAttribute(string minimum, string maximum)
    {
        Minimum = ParseBound(minimum, nameof(minimum));
        Maximum = ParseBound(maximum, nameof(maximum));

        if (Minimum > Maximum)
        {
            throw new ArgumentException("Minimum cannot be greater than maximum.", nameof(minimum));
        }
    }

    public decimal Minimum { get; }

    public decimal Maximum { get; }

    public override bool IsValid(object? value)
    {
        if (value is null)
        {
            return true;
        }

        if (!TryConvertToDecimal(value, out var numericValue))
        {
            return false;
        }

        return numericValue >= Minimum && numericValue <= Maximum;
    }

    public override string FormatErrorMessage(string name)
    {
        return string.Format(
            CultureInfo.CurrentCulture,
            ErrorMessageString ?? "{0} must be between {1} and {2}.",
            name,
            Minimum,
            Maximum);
    }

    private static decimal ParseBound(string value, string parameterName)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException("Range bounds must be provided.", parameterName);
        }

        if (!decimal.TryParse(value, NumberStyles.Number, InvariantCulture, out var parsed))
        {
            throw new ArgumentException("Range bounds must be valid decimal numbers.", parameterName);
        }

        return parsed;
    }

    private static bool TryConvertToDecimal(object value, out decimal result)
    {
        if (value is decimal directDecimal)
        {
            result = directDecimal;
            return true;
        }

        if (value is IConvertible convertible)
        {
            try
            {
                result = convertible.ToDecimal(InvariantCulture);
                return true;
            }
            catch (FormatException)
            {
                // ignored - fall through to return false
            }
            catch (InvalidCastException)
            {
                // ignored - fall through to return false
            }
            catch (OverflowException)
            {
                // ignored - fall through to return false
            }
        }

        result = default;
        return false;
    }
}
