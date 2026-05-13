import { InputHTMLAttributes } from "react";

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function FormField({ label, className = "", ...props }: FormFieldProps) {
  return (
    <label className="grid gap-1 text-sm font-semibold text-uau-black">
      <span>{label}</span>
      <input
        className={`h-11 rounded-lg border border-gray-300 px-3 text-sm font-normal outline-none focus:border-uau-green ${className}`}
        {...props}
      />
    </label>
  );
}

export function MoneyInput(props: FormFieldProps) {
  return <FormField min="0" step="0.01" type="number" {...props} />;
}

export function PercentInput(props: FormFieldProps) {
  return <FormField max="100" min="0" step="0.01" type="number" {...props} />;
}
