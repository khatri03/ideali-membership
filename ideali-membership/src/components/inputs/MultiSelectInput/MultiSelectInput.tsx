import Select, { components, type MultiValue, type OptionProps, type StylesConfig } from "react-select";

type MultiSelectOption = {
  label: string;
  value: string;
};

type MultiSelectInputProps = {
  value: string[];
  onChange: (value: string[]) => void;
  options: MultiSelectOption[];
  placeholder?: string;
  isDisabled?: boolean;
  className?: string;
  inputId?: string;
};

const selectStyles: StylesConfig<MultiSelectOption, true> = {
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
  multiValue: (base) => ({
    ...base,
    borderRadius: "9999px",
    backgroundColor: "#ecfeff",
  }),
  multiValueLabel: (base) => ({
    ...base,
    padding: "0.15rem 0.5rem",
    color: "#155e75",
    fontWeight: 600,
  }),
  multiValueRemove: (base) => ({
    ...base,
    borderRadius: "9999px",
    color: "#0f766e",
    ":hover": {
      backgroundColor: "#cffafe",
      color: "#0f766e",
    },
  }),
  menu: (base) => ({
    ...base,
    zIndex: 30,
    borderRadius: "1rem",
    overflow: "hidden",
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "#06b6d4"
      : state.isFocused
        ? "#ecfeff"
        : "#ffffff",
    color: state.isSelected ? "#ffffff" : "#0f172a",
  }),
  clearIndicator: (base) => ({
    ...base,
    color: "#94a3b8",
    ":hover": {
      color: "#334155",
    },
  }),
  dropdownIndicator: (base, state) => ({
    ...base,
    color: state.isDisabled ? "#cbd5e1" : "#64748b",
    ":hover": {
      color: state.isDisabled ? "#cbd5e1" : "#334155",
    },
  }),
};

function CheckboxOption(props: OptionProps<MultiSelectOption, true>) {
  return (
    <components.Option {...props}>
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={props.isSelected}
          readOnly
          tabIndex={-1}
          className="h-4 w-4 rounded border-slate-300 accent-cyan-600"
        />
        <span>{props.label}</span>
      </div>
    </components.Option>
  );
}

export function MultiSelectInput({
  value,
  onChange,
  options,
  placeholder = "Select options",
  isDisabled = false,
  className,
  inputId,
}: MultiSelectInputProps) {
  const selectedOptions = options.filter((option) => value.includes(option.value));

  return (
    <Select<MultiSelectOption, true>
      inputId={inputId}
      isMulti
      isDisabled={isDisabled}
      closeMenuOnSelect={false}
      hideSelectedOptions={false}
      isClearable
      options={options}
      value={selectedOptions}
      placeholder={placeholder}
      className={className}
      classNamePrefix="multi-select"
      styles={selectStyles}
      components={{
        Option: CheckboxOption,
      }}
      onChange={(nextValue: MultiValue<MultiSelectOption>) => {
        onChange(nextValue.map((option) => option.value));
      }}
    />
  );
}
