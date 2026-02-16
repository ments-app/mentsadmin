'use client';

import { useRef, useState, useCallback } from 'react';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';
import { uploadBannerImage } from '@/actions/upload';

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
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
      </label>

      {displayUrl ? (
        <div className="relative overflow-hidden rounded-lg border border-card-border">
          <img
            src={displayUrl}
            alt="Banner preview"
            className="h-40 w-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
            {uploading ? (
              <Loader2 size={24} className="animate-spin text-white" />
            ) : (
              <button
                type="button"
                onClick={handleRemove}
                className="flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-sm font-medium text-gray-900 transition-colors hover:bg-white"
              >
                <X size={16} />
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
          className={`flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed p-8 text-sm transition-colors ${
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-card-border text-muted hover:border-primary/50 hover:text-foreground'
          }`}
        >
          {uploading ? (
            <Loader2 size={24} className="animate-spin" />
          ) : (
            <>
              <ImageIcon size={24} />
              <span>Click to browse or drag and drop</span>
              <span className="text-xs">JPEG, PNG, WebP, GIF — max 5MB</span>
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
        <p className="mt-1.5 text-sm text-danger">{error}</p>
      )}
    </div>
  );
}
