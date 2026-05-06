type CheckboxOption = {
  label: string;
  value: string;
};

type CheckboxGroupInputProps = {
  value: string[];
  onChange: (value: string[]) => void;
  options: CheckboxOption[];
  className?: string;
  disabled?: boolean;
};

export function CheckboxGroupInput({
  value,
  onChange,
  options,
  className,
  disabled = false,
}: CheckboxGroupInputProps) {
  return (
    <div className={["space-y-2", className].filter(Boolean).join(" ")}>
      {options.map((option) => {
        const checked = value.includes(option.value);

        return (
          <label
            key={option.value}
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-cyan-300 hover:bg-cyan-50"
          >
            <input
              type="checkbox"
              checked={checked}
              disabled={disabled}
              onChange={(event) => {
                const next = event.target.checked
                  ? [...value, option.value]
                  : value.filter((item) => item !== option.value);
                onChange(Array.from(new Set(next)));
              }}
              className="h-4 w-4 accent-cyan-600"
            />
            <span className="min-w-0 flex-1">{option.label}</span>
          </label>
        );
      })}
    </div>
  );
}
