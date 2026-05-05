import { useEffect, useState } from "react";
import { fetchStateOptions } from "../../../lib/customForms";

type StateSelectInputProps = {
  countryId?: string | null;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
};

export function StateSelectInput({
  countryId,
  value,
  onChange,
  placeholder = "Select state",
  className,
  disabled = false,
  style,
}: StateSelectInputProps) {
  const [options, setOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const trimmedCountryId = countryId?.trim() ?? "";

  useEffect(() => {
    let cancelled = false;

    async function loadStates() {
      if (!trimmedCountryId) {
        setOptions([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const nextOptions = await fetchStateOptions(trimmedCountryId);
        if (!cancelled) {
          setOptions(nextOptions);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadStates();

    return () => {
      cancelled = true;
    };
  }, [trimmedCountryId]);

  if (!trimmedCountryId) {
    return (
      <select
        value=""
        disabled
        className={className}
        style={style}
      >
        <option value="">Select a country first</option>
      </select>
    );
  }

  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled || isLoading}
      className={className}
      style={style}
    >
      <option value="">{isLoading ? "Loading states..." : placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
