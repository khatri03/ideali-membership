import { useEffect, useMemo, useState } from "react";
import Select, { type StylesConfig } from "react-select";
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
  const selectedValue = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value],
  );

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

  const selectStyles: StylesConfig<{ label: string; value: string }, false> = {
    control: (base, state) => ({
      ...base,
      minHeight: "3.25rem",
      borderRadius: "1rem",
      borderColor: state.isFocused ? "#22d3ee" : "#e2e8f0",
      backgroundColor: "#ffffff",
      boxShadow: state.isFocused ? "0 0 0 4px rgba(34, 211, 238, 0.12)" : "none",
      ":hover": {
        borderColor: state.isFocused ? "#22d3ee" : "#cbd5e1",
      },
    }),
    valueContainer: (base) => ({
      ...base,
      padding: "0.5rem 0.75rem",
    }),
    input: (base) => ({
      ...base,
      margin: 0,
      padding: 0,
    }),
    placeholder: (base) => ({
      ...base,
      color: "#94a3b8",
    }),
    menu: (base) => ({
      ...base,
      zIndex: 30,
      borderRadius: "1rem",
      overflow: "hidden",
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused ? "#ecfeff" : "#ffffff",
      color: "#0f172a",
    }),
  };

  return (
    <Select<{ label: string; value: string }, false>
      value={selectedValue}
      onChange={(nextValue) => onChange(nextValue?.value ?? "")}
      options={options}
      isDisabled={disabled || isLoading}
      isLoading={isLoading}
      isClearable
      isSearchable
      placeholder={isLoading ? "Loading countries..." : placeholder}
      noOptionsMessage={({ inputValue }) =>
        inputValue.trim().length > 0 ? "No countries match your search." : "No countries available."
      }
      className={className}
      styles={selectStyles}
      filterOption={(candidate, inputValue) => {
        const search = inputValue.trim().toLowerCase();
        if (!search) {
          return true;
        }

        const label = String(candidate.label ?? "").toLowerCase();
        return label.includes(search);
      }}
    />
  );
}
