import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes } from "react";

interface FieldWrapperProps {
  label?: string;
  error?: string;
  hint?: string;
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement>, FieldWrapperProps {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = "", id, ...props }, ref) => {
    return (
      <label className="block text-sm">
        {label && <span className="mb-1 block font-medium text-slate-700">{label}</span>}
        <input
          ref={ref}
          id={id}
          className={`w-full rounded-lg border px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 ${
            error ? "border-status-danger" : "border-slate-300"
          } ${className}`}
          {...props}
        />
        {hint && !error && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
        {error && <span className="mt-1 block text-xs text-status-danger">{error}</span>}
      </label>
    );
  }
);
Input.displayName = "Input";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement>, FieldWrapperProps {}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, className = "", children, id, ...props }, ref) => {
    return (
      <label className="block text-sm">
        {label && <span className="mb-1 block font-medium text-slate-700">{label}</span>}
        <select
          ref={ref}
          id={id}
          className={`w-full rounded-lg border bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 ${
            error ? "border-status-danger" : "border-slate-300"
          } ${className}`}
          {...props}
        >
          {children}
        </select>
        {hint && !error && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
        {error && <span className="mt-1 block text-xs text-status-danger">{error}</span>}
      </label>
    );
  }
);
Select.displayName = "Select";
