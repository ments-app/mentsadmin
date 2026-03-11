'use client';

import { cn } from '@/lib/cn';
import { AlertCircle, ChevronDown } from 'lucide-react';

interface BaseProps {
  label: string;
  name: string;
  error?: string;
  required?: boolean;
}

interface TextFieldProps extends BaseProps {
  type: 'text' | 'url' | 'email' | 'date' | 'datetime-local';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface TextareaProps extends BaseProps {
  type: 'textarea';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

interface SelectProps extends BaseProps {
  type: 'select';
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

interface CheckboxProps extends BaseProps {
  type: 'checkbox';
  checked: boolean;
  onChange: (checked: boolean) => void;
}

type FormFieldProps = TextFieldProps | TextareaProps | SelectProps | CheckboxProps;

const inputBase = cn(
  'w-full rounded-[var(--radius-md)] border bg-input-bg px-3.5 py-2.5 text-sm text-foreground',
  'shadow-[var(--shadow-sm)] transition-all duration-200 placeholder:text-muted/50',
  'focus:outline-none focus:ring-2 focus:ring-input-focus/25 focus:border-input-focus',
  'disabled:cursor-not-allowed disabled:opacity-50'
);

const inputNormal = 'border-input-border';
const inputError = 'border-danger ring-2 ring-danger/15';

export default function FormField(props: FormFieldProps) {
  const { label, name, error, required, type } = props;
  const hasError = Boolean(error);

  if (type === 'checkbox') {
    const { checked, onChange } = props;
    return (
      <div className="flex items-start gap-3">
        <div className="relative mt-0.5 flex items-center">
          <input
            id={name}
            name={name}
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className={cn(
              'peer h-[18px] w-[18px] shrink-0 cursor-pointer appearance-none rounded-[5px]',
              'border border-input-border bg-input-bg transition-all duration-150',
              'checked:border-primary checked:bg-primary',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-input-focus/25'
            )}
          />
          <svg
            className="pointer-events-none absolute left-0 top-0 h-[18px] w-[18px] text-white opacity-0 peer-checked:opacity-100"
            viewBox="0 0 18 18"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M5 9l2.5 2.5L13 6.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div>
          <label
            htmlFor={name}
            className="cursor-pointer text-sm font-medium text-foreground"
          >
            {label}
          </label>
          {error && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-danger">
              <AlertCircle size={12} />
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1.5 block text-sm font-medium text-foreground"
      >
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </label>

      {type === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          placeholder={props.placeholder}
          rows={props.rows ?? 4}
          required={required}
          className={cn(inputBase, 'resize-y', hasError ? inputError : inputNormal)}
        />
      ) : type === 'select' ? (
        <div className="relative">
          <select
            id={name}
            name={name}
            value={props.value}
            onChange={(e) => props.onChange(e.target.value)}
            required={required}
            className={cn(
              inputBase,
              'cursor-pointer appearance-none pr-10',
              hasError ? inputError : inputNormal
            )}
          >
            <option value="">Select...</option>
            {props.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
        </div>
      ) : (
        <div className="relative">
          <input
            id={name}
            name={name}
            type={type}
            value={props.value}
            onChange={(e) => props.onChange(e.target.value)}
            placeholder={props.placeholder}
            required={required}
            className={cn(inputBase, hasError ? inputError : inputNormal)}
          />
          {hasError && (
            <AlertCircle
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-danger"
              aria-hidden="true"
            />
          )}
        </div>
      )}

      {error && (
        <p className="mt-1.5 flex items-center gap-1 text-xs text-danger">
          <AlertCircle size={12} />
          {error}
        </p>
      )}
    </div>
  );
}
