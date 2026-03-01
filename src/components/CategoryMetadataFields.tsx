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
      {fields.map((field) =>
        field.type === 'select' ? (
          <FormField
            key={field.key}
            type="select"
            label={field.label}
            name={field.key}
            value={values[field.key] || ''}
            onChange={(v: string) => onChange(field.key, v)}
            options={field.options ?? []}
          />
        ) : field.type === 'textarea' ? (
          <FormField
            key={field.key}
            type="textarea"
            label={field.label}
            name={field.key}
            value={values[field.key] || ''}
            onChange={(v: string) => onChange(field.key, v)}
            placeholder={field.placeholder}
            rows={3}
          />
        ) : (
          <FormField
            key={field.key}
            type="text"
            label={field.label}
            name={field.key}
            value={values[field.key] || ''}
            onChange={(v: string) => onChange(field.key, v)}
            placeholder={field.placeholder}
          />
        )
      )}
    </div>
  );
}
