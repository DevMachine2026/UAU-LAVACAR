import { InputHTMLAttributes } from "react";

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  prefix?: string;
};

export function FormField({ label, className = "", prefix, ...props }: FormFieldProps) {
  return (
    <label className="grid gap-1 text-sm font-semibold text-uau-black">
      <span>{label}</span>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-normal text-uau-gray">
            {prefix}
          </span>
        )}
        <input
          className={`h-11 w-full rounded-lg border border-gray-300 ${prefix ? "pl-9" : "px-3"} pr-3 text-sm font-normal outline-none focus:border-uau-primary ${className}`}
          {...props}
        />
      </div>
    </label>
  );
}

export function MoneyInput(props: FormFieldProps) {
  return <FormField min="0" prefix="R$" step="0.01" type="number" {...props} />;
}

export function PercentInput(props: FormFieldProps) {
  return <FormField max="100" min="0" step="0.01" type="number" {...props} />;
}
