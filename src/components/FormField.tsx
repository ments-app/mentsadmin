'use client';

import { cn } from '@/lib/cn';

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

const inputClasses =
  'w-full rounded-lg border border-card-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary';

export default function FormField(props: FormFieldProps) {
  const { label, name, error, required, type } = props;

  if (type === 'checkbox') {
    const { checked, onChange } = props;
    return (
      <div className="flex items-center gap-3">
        <input
          id={name}
          name={name}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border-card-border text-primary focus:ring-primary"
        />
        <label htmlFor={name} className="text-sm font-medium text-foreground">
          {label}
        </label>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-danger"> *</span>}
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
          className={cn(inputClasses, 'resize-y')}
        />
      ) : type === 'select' ? (
        <select
          id={name}
          name={name}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          required={required}
          className={inputClasses}
        >
          <option value="">Select...</option>
          {props.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          placeholder={props.placeholder}
          required={required}
          className={inputClasses}
        />
      )}

      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
