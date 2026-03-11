'use client';

import { useRef, useState, useCallback } from 'react';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';
import { uploadBannerImage } from '@/actions/upload';
import { cn } from '@/lib/cn';

interface ImageUploadProps {
  label: string;
  name: string;
  value: string;
  onChange: (url: string) => void;
}

export default function ImageUpload({ label, name, value, onChange }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    setError('');
    setUploading(true);

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const url = await uploadBannerImage(formData);
      onChange(url);
      setPreview(null);
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setPreview(null);
      URL.revokeObjectURL(objectUrl);
    } finally {
      setUploading(false);
    }
  }, [onChange]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleRemove() {
    onChange('');
    setPreview(null);
    setError('');
  }

  const displayUrl = preview || value;

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-foreground">
        {label}
      </label>

      {displayUrl ? (
        <div className="group relative overflow-hidden rounded-lg border border-input-border shadow-[var(--shadow-sm)] transition-all duration-200 hover:border-input-focus/40">
          <img
            src={displayUrl}
            alt="Banner preview"
            className="h-44 w-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-300 group-hover:bg-black/50">
            {uploading ? (
              <Loader2 size={28} className="animate-spin text-white drop-shadow-md" />
            ) : (
              <button
                type="button"
                onClick={handleRemove}
                className="flex items-center gap-1.5 rounded-lg bg-white/90 px-4 py-2 text-sm font-medium text-gray-900 opacity-0 shadow-md backdrop-blur-sm transition-all duration-200 hover:bg-white group-hover:opacity-100"
              >
                <X size={14} />
                Remove
              </button>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            'flex w-full flex-col items-center gap-3 rounded-lg border-2 border-dashed px-6 py-10 text-sm transition-all duration-200',
            dragOver
              ? 'border-input-focus bg-input-focus/5 shadow-[0_0_0_3px_rgba(99,102,241,0.1)]'
              : 'border-input-border bg-input-bg text-muted hover:border-input-focus/50 hover:bg-input-focus/[0.03] hover:text-foreground'
          )}
        >
          {uploading ? (
            <Loader2 size={28} className="animate-spin text-input-focus" />
          ) : (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-input-focus/10 text-input-focus">
                <ImageIcon size={22} />
              </div>
              <div className="text-center">
                <span className="font-medium text-foreground">Click to browse or drag and drop</span>
                <span className="mt-1 block text-xs text-muted">JPEG, PNG, WebP, GIF — max 5MB</span>
              </div>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        name={name}
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleInputChange}
        className="hidden"
      />

      {error && (
        <p className="mt-1.5 text-sm font-medium text-danger">{error}</p>
      )}
    </div>
  );
}
