"use client";

interface FilterOption {
  label: string;
  value: string;
}

interface FilterProps {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  className?: string;
}

export default function Filter({
  label,
  value,
  options,
  onChange,
  className = "",
}: FilterProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="label">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input h-10 cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// Compact inline filter (no label)
export function FilterSelect({
  value,
  options,
  onChange,
  placeholder = "Filter…",
  className = "",
}: Omit<FilterProps, "label"> & { placeholder?: string }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`input h-10 cursor-pointer ${className}`}
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
