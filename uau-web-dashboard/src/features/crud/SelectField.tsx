import { SelectHTMLAttributes } from "react";
import { Option } from "./types";

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: Option[];
  placeholder?: string;
};

export function SelectField({ label, options, placeholder = "Selecione", className = "", ...props }: SelectFieldProps) {
  return (
    <label className="grid gap-1 text-sm font-semibold text-uau-black">
      <span>{label}</span>
      <select
        className={`h-11 rounded-lg border border-gray-300 px-3 text-sm font-normal outline-none focus:border-uau-primary ${className}`}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
