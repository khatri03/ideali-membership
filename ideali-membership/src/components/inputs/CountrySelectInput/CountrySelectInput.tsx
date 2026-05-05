import { useEffect, useState } from "react";
import { fetchCountryOptions } from "../../../lib/customForms";

type CountrySelectInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

export function CountrySelectInput({
  value,
  onChange,
  placeholder = "Select country",
  className,
  disabled = false,
}: CountrySelectInputProps) {
  const [options, setOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadCountries() {
      setIsLoading(true);

      try {
        const nextOptions = await fetchCountryOptions();
        if (!cancelled) {
          setOptions(nextOptions);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadCountries();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled || isLoading}
      className={className}
    >
      <option value="">{isLoading ? "Loading countries..." : placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
