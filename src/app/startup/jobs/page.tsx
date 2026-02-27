'use client';

import { useEffect, useState } from 'react';
import { getStartupJobs, deleteStartupJob, createStartupJob } from '@/actions/startup-portal';
import { format } from 'date-fns';
import { Briefcase, RefreshCw, Plus, Trash2 } from 'lucide-react';

export default function StartupJobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await getStartupJobs();
      setJobs(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: string) {
    if (!confirm('Delete this job?')) return;
    setDeleting(id);
    try {
      await deleteStartupJob(id);
      await load();
    } catch (e: any) { alert(e.message); }
    setDeleting(null);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Your Jobs</h1>
          <p className="mt-1 text-sm text-muted">Manage job postings for your startup</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
        >
          <Plus size={16} /> Post Job
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="animate-spin text-primary" size={24} />
        </div>
      ) : jobs.length === 0 ? (
        <div className="py-16 text-center">
          <Briefcase size={40} className="mx-auto mb-3 text-muted opacity-40" />
          <p className="font-medium text-foreground">No jobs posted yet</p>
          <button onClick={() => setShowForm(true)}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white">
            Post Your First Job
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-card-border bg-card-bg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-background">
                <th className="px-4 py-3 text-left font-medium text-muted">Title</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Type</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Posted</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Status</th>
                <th className="px-4 py-3 text-right font-medium text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {jobs.map(job => (
                <tr key={job.id} className="hover:bg-background/50">
                  <td className="px-4 py-3 font-medium text-foreground">{job.title}</td>
                  <td className="px-4 py-3 text-muted capitalize">{job.job_type ?? '—'}</td>
                  <td className="px-4 py-3 text-muted">{format(new Date(job.created_at), 'MMM d, yyyy')}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      job.is_active
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {job.is_active ? 'Active' : 'Closed'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(job.id)}
                      disabled={deleting === job.id}
                      className="rounded-lg border border-red-200 p-1.5 text-danger hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <JobForm
          onClose={() => setShowForm(false)}
          onSuccess={() => { setShowForm(false); load(); }}
        />
      )}
    </div>
  );
}

function JobForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    title: '', company: '', description: '', location: '',
    salary_range: '', job_type: 'full_time', work_mode: 'remote',
    experience_level: 'entry', contact_email: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await createStartupJob(form);
      onSuccess();
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  const inputCls = 'w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg rounded-xl border border-card-border bg-card-bg p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-foreground mb-4">Post a Job</h3>
        {error && <div className="mb-3 rounded bg-red-50 p-2 text-sm text-danger dark:bg-red-950">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Job Title *</label>
            <input type="text" value={form.title} required
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              className={inputCls} placeholder="Senior Developer" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Company Name</label>
            <input type="text" value={form.company}
              onChange={e => setForm(p => ({ ...p, company: e.target.value }))}
              className={inputCls} placeholder="Acme Inc." />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Description *</label>
            <textarea value={form.description} required rows={3}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className={inputCls} placeholder="Job description..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Location</label>
              <input type="text" value={form.location}
                onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                className={inputCls} placeholder="Bangalore" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Salary Range</label>
              <input type="text" value={form.salary_range}
                onChange={e => setForm(p => ({ ...p, salary_range: e.target.value }))}
                className={inputCls} placeholder="8-12 LPA" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Job Type</label>
              <select value={form.job_type}
                onChange={e => setForm(p => ({ ...p, job_type: e.target.value }))}
                className={inputCls}>
                <option value="full_time">Full Time</option>
                <option value="part_time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Work Mode</label>
              <select value={form.work_mode}
                onChange={e => setForm(p => ({ ...p, work_mode: e.target.value }))}
                className={inputCls}>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">On-site</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Contact Email</label>
            <input type="email" value={form.contact_email}
              onChange={e => setForm(p => ({ ...p, contact_email: e.target.value }))}
              className={inputCls} placeholder="hr@startup.com" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-lg border border-card-border px-4 py-2 text-sm text-muted">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
              {loading ? 'Posting...' : 'Post Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
