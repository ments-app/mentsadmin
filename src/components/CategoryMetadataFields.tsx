'use client';

import FormField from '@/components/FormField';
import { CATEGORY_METADATA_FIELDS, CATEGORY_METADATA_LABELS } from '@/lib/category-metadata';

type Props = {
  category: string;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
};

export default function CategoryMetadataFields({ category, values, onChange }: Props) {
  const fields = CATEGORY_METADATA_FIELDS[category];
  const label = CATEGORY_METADATA_LABELS[category];

  if (!fields || fields.length === 0) return null;

  return (
    <div className="space-y-4 rounded-lg border border-card-border p-4">
      <h3 className="text-sm font-semibold text-foreground">{label}</h3>
      {fields.map((field) => (
        <FormField
          key={field.key}
          type={field.type}
          label={field.label}
          name={field.key}
          value={values[field.key] || ''}
          onChange={(v: string) => onChange(field.key, v)}
          placeholder={field.placeholder}
          options={field.options}
          rows={field.type === 'textarea' ? 3 : undefined}
        />
      ))}
    </div>
  );
}
