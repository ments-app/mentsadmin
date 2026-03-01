'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerAsFacilitator } from '@/actions/rbac';
import { supabase } from '@/lib/supabase';
import { Upload, ArrowLeft, CheckCircle2 } from 'lucide-react';

const ORG_TYPES = [
  { value: 'ecell', label: 'E-Cell' },
  { value: 'incubator', label: 'Incubator' },
  { value: 'accelerator', label: 'Accelerator' },
  { value: 'college_cell', label: 'College Cell' },
  { value: 'other', label: 'Other' },
];

export default function FacilitatorOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [docUploading, setDocUploading] = useState(false);

  const [form, setForm] = useState({
    displayName: '',
    organisationName: '',
    organisationAddress: '',
    organisationType: '',
    officialEmail: '',
    pocName: '',
    contactNumber: '',
    website: '',
  });

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleDocUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocUploading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const ext = file.name.split('.').pop();
    const path = `verification-docs/${user.id}-${Date.now()}.${ext}`;

    const { data, error } = await supabase.storage
      .from('admin-documents')
      .upload(path, file, { upsert: false });

    if (error) {
      setError('Document upload failed: ' + error.message);
    } else {
      const { data: urlData } = supabase.storage.from('admin-documents').getPublicUrl(path);
      setDocumentUrl(urlData.publicUrl);
    }

    setDocUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.organisationType) { setError('Please select an organisation type.'); return; }
    setError('');
    setLoading(true);

    const result = await registerAsFacilitator({
      displayName: form.displayName,
      organisationName: form.organisationName,
      organisationAddress: form.organisationAddress,
      organisationType: form.organisationType,
      officialEmail: form.officialEmail,
      pocName: form.pocName,
      contactNumber: form.contactNumber,
      website: form.website || undefined,
      documentUrl: documentUrl || undefined,
    });

    if (!result.success) {
      setError(result.error ?? 'Submission failed');
      setLoading(false);
      return;
    }

    setStep(3);
    setLoading(false);
  }

  if (step === 3) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle2 size={40} className="text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Application Submitted!</h2>
          <p className="mt-3 text-muted">
            Your verification request has been submitted. Our team will review it and get back to you within 2–3 business days.
          </p>
          <button
            onClick={() => router.push('/pending-verification')}
            className="mt-6 w-full rounded-lg bg-primary px-4 py-2.5 font-medium text-white"
          >
            View Status
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-xl">
        <div className="mb-8">
          <button
            onClick={() => router.push('/onboarding')}
            className="flex items-center gap-1 text-sm text-muted hover:text-foreground"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <h1 className="mt-4 text-2xl font-bold text-foreground">Get Verified as a Facilitator</h1>
          <p className="mt-1 text-sm text-muted">Complete your organisation profile to get started.</p>

          {/* Progress */}
          <div className="mt-4 flex gap-2">
            {[1, 2].map(s => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-colors ${step >= s ? 'bg-primary' : 'bg-card-border'}`}
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-danger dark:bg-red-950">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {step === 1 && (
            <>
              <h2 className="font-semibold text-foreground">Your Details</h2>

              <Field label="Your Full Name">
                <input
                  type="text"
                  value={form.displayName}
                  onChange={e => update('displayName', e.target.value)}
                  required
                  className={inputCls}
                  placeholder="John Doe"
                />
              </Field>

              <Field label="Organisation Name">
                <input
                  type="text"
                  value={form.organisationName}
                  onChange={e => update('organisationName', e.target.value)}
                  required
                  className={inputCls}
                  placeholder="BITS Pilani E-Cell"
                />
              </Field>

              <Field label="Organisation Type">
                <select
                  value={form.organisationType}
                  onChange={e => update('organisationType', e.target.value)}
                  required
                  className={inputCls}
                >
                  <option value="">Select type...</option>
                  {ORG_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </Field>

              <Field label="Organisation Address">
                <textarea
                  value={form.organisationAddress}
                  onChange={e => update('organisationAddress', e.target.value)}
                  required
                  rows={2}
                  className={inputCls}
                  placeholder="123 Main St, City, State 400001"
                />
              </Field>

              <button
                type="button"
                onClick={() => {
                  if (!form.displayName || !form.organisationName || !form.organisationType || !form.organisationAddress) {
                    setError('Please fill all required fields.');
                    return;
                  }
                  setError('');
                  setStep(2);
                }}
                className="w-full rounded-lg bg-primary px-4 py-2.5 font-medium text-white"
              >
                Continue
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="font-semibold text-foreground">Contact & Documents</h2>

              <Field label="Official Email">
                <input
                  type="email"
                  value={form.officialEmail}
                  onChange={e => update('officialEmail', e.target.value)}
                  required
                  className={inputCls}
                  placeholder="contact@organisation.com"
                />
              </Field>

              <Field label="Point of Contact Name">
                <input
                  type="text"
                  value={form.pocName}
                  onChange={e => update('pocName', e.target.value)}
                  required
                  className={inputCls}
                  placeholder="Priya Sharma"
                />
              </Field>

              <Field label="Contact Number">
                <input
                  type="tel"
                  value={form.contactNumber}
                  onChange={e => update('contactNumber', e.target.value)}
                  required
                  className={inputCls}
                  placeholder="+91 98765 43210"
                />
              </Field>

              <Field label="Website (optional)">
                <input
                  type="url"
                  value={form.website}
                  onChange={e => update('website', e.target.value)}
                  className={inputCls}
                  placeholder="https://ecell.bits.ac.in"
                />
              </Field>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Supporting Document <span className="text-muted">(optional — PDF/image)</span>
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-card-border bg-background p-4 text-sm text-muted hover:border-primary hover:text-primary transition-colors">
                  <Upload size={18} />
                  {documentUrl ? 'Document uploaded ✓' : docUploading ? 'Uploading...' : 'Click to upload'}
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={handleDocUpload}
                    disabled={docUploading}
                  />
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-lg border border-card-border bg-background px-4 py-2.5 font-medium text-foreground"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-lg bg-primary px-4 py-2.5 font-medium text-white disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit for Verification'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

const inputCls = 'w-full rounded-lg border border-card-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}
