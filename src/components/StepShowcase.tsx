'use client';

import { useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ImagePlus, Link2, Loader2, Plus, Trash2, Type } from 'lucide-react';
import { uploadSlideImage } from '@/actions/upload';

export type ShowcaseTextSection = {
  heading: string;
  content: string;
};

export type ShowcaseSlide = {
  slide_url: string;
  caption: string;
};

export type ShowcaseLink = {
  title: string;
  url: string;
};

type StepShowcaseProps = {
  textSections: ShowcaseTextSection[];
  slides: ShowcaseSlide[];
  links: ShowcaseLink[];
  onTextSectionsChange: (sections: ShowcaseTextSection[]) => void;
  onSlidesChange: (slides: ShowcaseSlide[]) => void;
  onLinksChange: (links: ShowcaseLink[]) => void;
};

export default function StepShowcase({
  textSections,
  slides,
  links,
  onTextSectionsChange,
  onSlidesChange,
  onLinksChange,
}: StepShowcaseProps) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState('');
  const fileInputs = useRef<Record<number, HTMLInputElement | null>>({});

  async function handleSlideUpload(index: number, file: File) {
    setUploadingIndex(index);
    setUploadError('');

    try {
      const payload = new FormData();
      payload.append('file', file);
      const url = await uploadSlideImage(payload);
      onSlidesChange(
        slides.map((slide, slideIndex) =>
          slideIndex === index ? { ...slide, slide_url: url } : slide
        )
      );
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Slide upload failed');
    } finally {
      setUploadingIndex(null);
    }
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        icon={<Type size={15} />}
        title="Text Sections"
        desc="Add long-form sections such as mission, problem, product, or market context."
        actionLabel="Add Section"
        onAdd={() => {
          if (textSections.length >= 20) return;
          onTextSectionsChange([...textSections, { heading: '', content: '' }]);
        }}
      />
      <div className="space-y-3">
        {textSections.map((section, index) => (
          <CardRow
            key={`text-${index}`}
            index={index}
            total={textSections.length}
            onMoveUp={() => moveItem(textSections, index, index - 1, onTextSectionsChange)}
            onMoveDown={() => moveItem(textSections, index, index + 1, onTextSectionsChange)}
            onRemove={() => onTextSectionsChange(textSections.filter((_, itemIndex) => itemIndex !== index))}
          >
            <div className="grid gap-3">
              <Field label="Heading">
                <input
                  className={inputCls}
                  value={section.heading}
                  onChange={(e) => onTextSectionsChange(textSections.map((item, itemIndex) => itemIndex === index ? { ...item, heading: e.target.value } : item))}
                  placeholder="Our Mission"
                />
              </Field>
              <Field label="Content">
                <textarea
                  className={textareaCls}
                  rows={4}
                  value={section.content}
                  onChange={(e) => onTextSectionsChange(textSections.map((item, itemIndex) => itemIndex === index ? { ...item, content: e.target.value } : item))}
                  placeholder="Describe this part of the startup story"
                />
              </Field>
            </div>
          </CardRow>
        ))}
        {textSections.length === 0 && <EmptyHint>No text sections added yet.</EmptyHint>}
      </div>

      <SectionHeader
        icon={<ImagePlus size={15} />}
        title="Slides"
        desc="Upload showcase slides with optional captions."
        actionLabel="Add Slide"
        onAdd={() => {
          if (slides.length >= 50) return;
          onSlidesChange([...slides, { slide_url: '', caption: '' }]);
        }}
      />
      <div className="space-y-3">
        {slides.map((slide, index) => (
          <CardRow
            key={`slide-${index}`}
            index={index}
            total={slides.length}
            onMoveUp={() => moveItem(slides, index, index - 1, onSlidesChange)}
            onMoveDown={() => moveItem(slides, index, index + 1, onSlidesChange)}
            onRemove={() => onSlidesChange(slides.filter((_, itemIndex) => itemIndex !== index))}
          >
            <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)]">
              <div>
                {slide.slide_url ? (
                  <div className="overflow-hidden rounded-xl border border-card-border bg-background">
                    <img src={slide.slide_url} alt="" className="h-36 w-full object-cover" />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputs.current[index]?.click()}
                    disabled={uploadingIndex === index}
                    className="flex h-36 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-card-border bg-background text-sm text-muted transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
                  >
                    {uploadingIndex === index ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
                    <span>Upload slide</span>
                  </button>
                )}
                <input
                  ref={(element) => {
                    fileInputs.current[index] = element;
                  }}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleSlideUpload(index, file);
                    e.target.value = '';
                  }}
                />
              </div>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => fileInputs.current[index]?.click()}
                  disabled={uploadingIndex === index}
                  className="inline-flex items-center gap-2 rounded-lg border border-card-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
                >
                  {uploadingIndex === index ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
                  {slide.slide_url ? 'Replace image' : 'Choose image'}
                </button>
                <Field label="Caption">
                  <input
                    className={inputCls}
                    value={slide.caption}
                    onChange={(e) => onSlidesChange(slides.map((item, itemIndex) => itemIndex === index ? { ...item, caption: e.target.value } : item))}
                    placeholder="Optional caption"
                  />
                </Field>
                <Field label="Slide URL">
                  <input
                    className={inputCls}
                    value={slide.slide_url}
                    onChange={(e) => onSlidesChange(slides.map((item, itemIndex) => itemIndex === index ? { ...item, slide_url: e.target.value } : item))}
                    placeholder="https://..."
                  />
                </Field>
              </div>
            </div>
          </CardRow>
        ))}
        {slides.length === 0 && <EmptyHint>No slides added yet.</EmptyHint>}
        {uploadError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950/50 dark:text-red-400">
            {uploadError}
          </p>
        )}
      </div>

      <SectionHeader
        icon={<Link2 size={15} />}
        title="Links"
        desc="Add reference or product links such as website, demo, waitlist, or pitch materials."
        actionLabel="Add Link"
        onAdd={() => {
          if (links.length >= 30) return;
          onLinksChange([...links, { title: '', url: '' }]);
        }}
      />
      <div className="space-y-3">
        {links.map((link, index) => (
          <CardRow
            key={`link-${index}`}
            index={index}
            total={links.length}
            onMoveUp={() => moveItem(links, index, index - 1, onLinksChange)}
            onMoveDown={() => moveItem(links, index, index + 1, onLinksChange)}
            onRemove={() => onLinksChange(links.filter((_, itemIndex) => itemIndex !== index))}
          >
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Title">
                <input
                  className={inputCls}
                  value={link.title}
                  onChange={(e) => onLinksChange(links.map((item, itemIndex) => itemIndex === index ? { ...item, title: e.target.value } : item))}
                  placeholder="Website"
                />
              </Field>
              <Field label="URL">
                <input
                  className={inputCls}
                  value={link.url}
                  onChange={(e) => onLinksChange(links.map((item, itemIndex) => itemIndex === index ? { ...item, url: e.target.value } : item))}
                  placeholder="https://..."
                />
              </Field>
            </div>
          </CardRow>
        ))}
        {links.length === 0 && <EmptyHint>No links added yet.</EmptyHint>}
      </div>
    </div>
  );
}

function moveItem<T>(items: T[], from: number, to: number, setter: (items: T[]) => void) {
  if (to < 0 || to >= items.length) return;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  setter(next);
}

function SectionHeader({
  icon,
  title,
  desc,
  actionLabel,
  onAdd,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  actionLabel: string;
  onAdd: () => void;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-primary">{icon}</span>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
        </div>
        <p className="mt-1 text-sm text-muted">{desc}</p>
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center gap-2 rounded-lg border border-card-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
      >
        <Plus size={14} />
        {actionLabel}
      </button>
    </div>
  );
}

function CardRow({
  children,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  children: React.ReactNode;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-card-border bg-card-bg p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Item {index + 1}</span>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onMoveUp} disabled={index === 0} className={iconButtonCls}>
            <ArrowUp size={13} />
          </button>
          <button type="button" onClick={onMoveDown} disabled={index === total - 1} className={iconButtonCls}>
            <ArrowDown size={13} />
          </button>
          <button type="button" onClick={onRemove} className={`${iconButtonCls} hover:border-red-300 hover:text-red-600`}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">{label}</span>
      {children}
    </label>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-card-border bg-background px-4 py-6 text-sm text-muted">
      {children}
    </div>
  );
}

const iconButtonCls =
  'inline-flex h-8 w-8 items-center justify-center rounded-lg border border-card-border text-muted transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40';

const inputCls =
  'w-full rounded-xl border border-card-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20';

const textareaCls =
  'w-full rounded-xl border border-card-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20';
