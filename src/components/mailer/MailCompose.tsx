'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Send, Eye, EyeOff, Check, Mail, Loader2,
  FileText, X, Plus, ChevronDown, Clock,
} from 'lucide-react';
import { getMailBoxes, sendCampaign } from '@/actions/mailer';
import MailEditor, { type MailEditorRef } from './MailEditor';
import Link from 'next/link';

interface Props {
  role: 'facilitator' | 'startup';
}

type BoxWithCount = Awaited<ReturnType<typeof getMailBoxes>>[number];

// ─── Built-in Email Templates ────────────────────────────────────

interface EmailTemplate {
  id: string;
  name: string;
  category: string;
  subject: string;
  html: string;
}

const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'welcome-gradient',
    name: 'Welcome — Gradient',
    category: 'Onboarding',
    subject: 'Welcome to {{org_name}}! 🎉',
    html: `<div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:40px 20px;text-align:center;border-radius:16px 16px 0 0;">
  <h1 style="color:#ffffff;font-size:32px;margin:0 0 8px 0;font-family:Arial,sans-serif;">Welcome Aboard! 🎉</h1>
  <p style="color:rgba(255,255,255,0.85);font-size:16px;margin:0;font-family:Arial,sans-serif;">We're thrilled to have you in our community</p>
</div>
<div style="background:#ffffff;padding:32px 28px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px;font-family:Arial,sans-serif;">
  <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px 0;">Hello there! Welcome to <strong>{{org_name}}</strong>. We're excited to have you join us. Here's what you can look forward to:</p>
  <div style="display:flex;gap:12px;margin:20px 0;">
    <div style="flex:1;background:#f0f9ff;border-radius:12px;padding:20px;text-align:center;">
      <div style="font-size:28px;margin-bottom:8px;">💼</div>
      <p style="font-weight:700;color:#1e40af;font-size:14px;margin:0 0 4px 0;">Opportunities</p>
      <p style="color:#6b7280;font-size:12px;margin:0;">Curated jobs, gigs & internships</p>
    </div>
    <div style="flex:1;background:#fdf4ff;border-radius:12px;padding:20px;text-align:center;">
      <div style="font-size:28px;margin-bottom:8px;">🤝</div>
      <p style="font-weight:700;color:#7c3aed;font-size:14px;margin:0 0 4px 0;">Network</p>
      <p style="color:#6b7280;font-size:12px;margin:0;">Connect with mentors & peers</p>
    </div>
    <div style="flex:1;background:#ecfdf5;border-radius:12px;padding:20px;text-align:center;">
      <div style="font-size:28px;margin-bottom:8px;">🚀</div>
      <p style="font-weight:700;color:#059669;font-size:14px;margin:0 0 4px 0;">Grow</p>
      <p style="color:#6b7280;font-size:12px;margin:0;">Resources & programs for you</p>
    </div>
  </div>
  <div style="text-align:center;margin:32px 0 16px 0;">
    <a href="https://ments.in" style="background:linear-gradient(135deg,#667eea,#764ba2);color:#ffffff;padding:14px 40px;border-radius:50px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;box-shadow:0 4px 15px rgba(102,126,234,0.4);">Get Started →</a>
  </div>
  <p style="color:#9ca3af;font-size:13px;text-align:center;margin:0;">Warm regards,<br/><strong style="color:#374151;">The {{org_name}} Team</strong></p>
</div>`,
  },
  {
    id: 'event-colorful',
    name: 'Event Invitation — Vibrant',
    category: 'Events',
    subject: '📅 You\'re Invited: {{event_name}}',
    html: `<div style="background:#1e1b4b;padding:40px 28px;border-radius:16px 16px 0 0;text-align:center;font-family:Arial,sans-serif;">
  <p style="color:#a5b4fc;font-size:13px;text-transform:uppercase;letter-spacing:3px;margin:0 0 8px 0;font-weight:600;">You're Invited</p>
  <h1 style="color:#ffffff;font-size:28px;margin:0 0 12px 0;">{{event_name}}</h1>
  <p style="color:rgba(255,255,255,0.7);font-size:14px;margin:0;">An event you don't want to miss!</p>
</div>
<div style="background:#ffffff;padding:0;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px;font-family:Arial,sans-serif;">
  <div style="display:flex;border-bottom:1px solid #f3f4f6;">
    <div style="flex:1;padding:20px 24px;text-align:center;border-right:1px solid #f3f4f6;">
      <p style="color:#6366f1;font-size:22px;margin:0;">📍</p>
      <p style="color:#9ca3af;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:4px 0 2px 0;">Venue</p>
      <p style="color:#1f2937;font-size:14px;font-weight:600;margin:0;">{{venue}}</p>
    </div>
    <div style="flex:1;padding:20px 24px;text-align:center;border-right:1px solid #f3f4f6;">
      <p style="color:#6366f1;font-size:22px;margin:0;">🗓️</p>
      <p style="color:#9ca3af;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:4px 0 2px 0;">Date</p>
      <p style="color:#1f2937;font-size:14px;font-weight:600;margin:0;">{{date}}</p>
    </div>
    <div style="flex:1;padding:20px 24px;text-align:center;">
      <p style="color:#6366f1;font-size:22px;margin:0;">⏰</p>
      <p style="color:#9ca3af;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:4px 0 2px 0;">Time</p>
      <p style="color:#1f2937;font-size:14px;font-weight:600;margin:0;">{{time}}</p>
    </div>
  </div>
  <div style="padding:28px;">
    <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 24px 0;">{{event_description}}</p>
    <div style="text-align:center;margin:24px 0;">
      <a href="{{rsvp_link}}" style="background:#4f46e5;color:#ffffff;padding:14px 48px;border-radius:50px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;box-shadow:0 4px 15px rgba(79,70,229,0.3);">RSVP Now →</a>
    </div>
    <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;">We look forward to seeing you there!</p>
  </div>
</div>`,
  },
  {
    id: 'job-modern',
    name: 'Job Alert — Modern Card',
    category: 'Opportunities',
    subject: '💼 New Opening: {{job_title}} at {{company}}',
    html: `<div style="background:linear-gradient(135deg,#059669 0%,#0d9488 100%);padding:32px 28px;border-radius:16px 16px 0 0;font-family:Arial,sans-serif;">
  <p style="color:rgba(255,255,255,0.8);font-size:12px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px 0;">New Opportunity</p>
  <h1 style="color:#ffffff;font-size:26px;margin:0 0 6px 0;">{{job_title}}</h1>
  <p style="color:rgba(255,255,255,0.9);font-size:15px;margin:0;">at <strong>{{company}}</strong></p>
</div>
<div style="background:#ffffff;padding:28px;border:1px solid #e5e7eb;border-top:none;font-family:Arial,sans-serif;">
  <div style="display:flex;gap:10px;margin-bottom:24px;flex-wrap:wrap;">
    <span style="background:#ecfdf5;color:#059669;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:600;">📍 {{location}}</span>
    <span style="background:#eff6ff;color:#2563eb;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:600;">💰 {{salary}}</span>
    <span style="background:#fef3c7;color:#d97706;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:600;">⏰ {{job_type}}</span>
    <span style="background:#fce7f3;color:#db2777;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:600;">📅 Deadline: {{deadline}}</span>
  </div>
  <h3 style="color:#1f2937;font-size:15px;margin:0 0 10px 0;">About the Role</h3>
  <p style="color:#4b5563;font-size:14px;line-height:1.7;margin:0 0 20px 0;">{{job_description}}</p>
  <h3 style="color:#1f2937;font-size:15px;margin:0 0 10px 0;">What We're Looking For</h3>
  <ul style="color:#4b5563;font-size:14px;line-height:1.8;padding-left:20px;margin:0 0 24px 0;">
    <li>{{requirement_1}}</li>
    <li>{{requirement_2}}</li>
    <li>{{requirement_3}}</li>
  </ul>
</div>
<div style="background:#f9fafb;padding:24px 28px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px;text-align:center;font-family:Arial,sans-serif;">
  <a href="{{apply_link}}" style="background:linear-gradient(135deg,#059669,#0d9488);color:#ffffff;padding:14px 48px;border-radius:50px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;box-shadow:0 4px 15px rgba(5,150,105,0.3);">Apply Now →</a>
  <p style="color:#9ca3af;font-size:12px;margin:12px 0 0 0;">Good luck with your application! 🍀</p>
</div>`,
  },
  {
    id: 'competition-bold',
    name: 'Competition — Bold & Vibrant',
    category: 'Events',
    subject: '🏆 {{competition_name}} — Register Now!',
    html: `<div style="background:linear-gradient(135deg,#7c3aed 0%,#db2777 100%);padding:40px 28px;text-align:center;border-radius:16px 16px 0 0;font-family:Arial,sans-serif;">
  <p style="color:rgba(255,255,255,0.8);font-size:48px;margin:0 0 12px 0;">🏆</p>
  <h1 style="color:#ffffff;font-size:28px;margin:0 0 8px 0;">{{competition_name}}</h1>
  <p style="color:rgba(255,255,255,0.85);font-size:15px;margin:0;">Showcase your talent. Win big.</p>
</div>
<div style="background:#ffffff;padding:32px 28px;border:1px solid #e5e7eb;border-top:none;font-family:Arial,sans-serif;">
  <div style="background:linear-gradient(135deg,#faf5ff,#fdf2f8);border-radius:16px;padding:24px;margin-bottom:24px;">
    <div style="display:flex;flex-wrap:wrap;gap:16px;">
      <div style="flex:1;min-width:120px;text-align:center;">
        <p style="color:#a855f7;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px 0;font-weight:600;">Theme</p>
        <p style="color:#1f2937;font-size:14px;font-weight:700;margin:0;">{{theme}}</p>
      </div>
      <div style="flex:1;min-width:120px;text-align:center;">
        <p style="color:#ec4899;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px 0;font-weight:600;">Prize Pool</p>
        <p style="color:#1f2937;font-size:14px;font-weight:700;margin:0;">{{prize_pool}}</p>
      </div>
      <div style="flex:1;min-width:120px;text-align:center;">
        <p style="color:#a855f7;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px 0;font-weight:600;">Deadline</p>
        <p style="color:#1f2937;font-size:14px;font-weight:700;margin:0;">{{deadline}}</p>
      </div>
      <div style="flex:1;min-width:120px;text-align:center;">
        <p style="color:#ec4899;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px 0;font-weight:600;">Team Size</p>
        <p style="color:#1f2937;font-size:14px;font-weight:700;margin:0;">{{team_size}}</p>
      </div>
    </div>
  </div>
  <h3 style="color:#1f2937;font-size:15px;margin:0 0 12px 0;">Why Participate?</h3>
  <ul style="color:#4b5563;font-size:14px;line-height:2;padding-left:20px;margin:0 0 8px 0;">
    <li>🥇 Win exciting prizes and recognition</li>
    <li>👨‍💻 Showcase your skills to industry experts</li>
    <li>🤝 Network with like-minded innovators</li>
    <li>📜 Get certificates and mentorship</li>
  </ul>
</div>
<div style="background:#faf5ff;padding:24px 28px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px;text-align:center;font-family:Arial,sans-serif;">
  <a href="{{register_link}}" style="background:linear-gradient(135deg,#7c3aed,#db2777);color:#ffffff;padding:14px 48px;border-radius:50px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;box-shadow:0 4px 15px rgba(124,58,237,0.35);">Register Now →</a>
</div>`,
  },
  {
    id: 'newsletter-clean',
    name: 'Newsletter — Clean Layout',
    category: 'Newsletter',
    subject: '📬 Weekly Digest — {{date}}',
    html: `<div style="background:#0f172a;padding:32px 28px;border-radius:16px 16px 0 0;font-family:Arial,sans-serif;">
  <h1 style="color:#ffffff;font-size:24px;margin:0 0 4px 0;">📬 Weekly Digest</h1>
  <p style="color:#94a3b8;font-size:13px;margin:0;">{{date}} — Your weekly roundup of what matters</p>
</div>
<div style="background:#ffffff;padding:28px;border:1px solid #e5e7eb;border-top:none;font-family:Arial,sans-serif;">
  <div style="margin-bottom:24px;">
    <h2 style="color:#0f172a;font-size:16px;margin:0 0 12px 0;padding-bottom:8px;border-bottom:2px solid #3b82f6;">🔥 Highlights</h2>
    <div style="background:#f0f9ff;border-radius:10px;padding:16px;margin-bottom:8px;">
      <p style="color:#1e40af;font-size:14px;font-weight:600;margin:0 0 4px 0;">{{highlight_1_title}}</p>
      <p style="color:#64748b;font-size:13px;margin:0;">{{highlight_1_desc}}</p>
    </div>
    <div style="background:#f0f9ff;border-radius:10px;padding:16px;margin-bottom:8px;">
      <p style="color:#1e40af;font-size:14px;font-weight:600;margin:0 0 4px 0;">{{highlight_2_title}}</p>
      <p style="color:#64748b;font-size:13px;margin:0;">{{highlight_2_desc}}</p>
    </div>
  </div>
  <div style="margin-bottom:24px;">
    <h2 style="color:#0f172a;font-size:16px;margin:0 0 12px 0;padding-bottom:8px;border-bottom:2px solid #10b981;">💼 New Opportunities</h2>
    <div style="display:flex;gap:10px;flex-wrap:wrap;">
      <div style="flex:1;min-width:180px;background:#ecfdf5;border-radius:10px;padding:16px;">
        <p style="color:#059669;font-size:14px;font-weight:600;margin:0 0 4px 0;">{{opportunity_1}}</p>
        <p style="color:#64748b;font-size:12px;margin:0;">{{opportunity_1_company}}</p>
      </div>
      <div style="flex:1;min-width:180px;background:#ecfdf5;border-radius:10px;padding:16px;">
        <p style="color:#059669;font-size:14px;font-weight:600;margin:0 0 4px 0;">{{opportunity_2}}</p>
        <p style="color:#64748b;font-size:12px;margin:0;">{{opportunity_2_company}}</p>
      </div>
    </div>
  </div>
  <div style="margin-bottom:24px;">
    <h2 style="color:#0f172a;font-size:16px;margin:0 0 12px 0;padding-bottom:8px;border-bottom:2px solid #f59e0b;">📅 Upcoming Events</h2>
    <div style="background:#fffbeb;border-radius:10px;padding:16px;margin-bottom:8px;">
      <p style="color:#d97706;font-size:14px;font-weight:600;margin:0 0 4px 0;">{{event_1}}</p>
      <p style="color:#64748b;font-size:12px;margin:0;">{{event_1_date}}</p>
    </div>
  </div>
</div>
<div style="background:#0f172a;padding:24px 28px;border-radius:0 0 16px 16px;text-align:center;font-family:Arial,sans-serif;">
  <a href="https://ments.in" style="background:#3b82f6;color:#ffffff;padding:12px 36px;border-radius:50px;text-decoration:none;font-weight:600;font-size:14px;display:inline-block;">View All on Platform →</a>
  <p style="color:#64748b;font-size:11px;margin:12px 0 0 0;">Stay tuned for more updates next week!</p>
</div>`,
  },
  {
    id: 'announcement-warm',
    name: 'Announcement — Warm',
    category: 'General',
    subject: '📢 {{title}}',
    html: `<div style="background:linear-gradient(135deg,#f59e0b 0%,#ef4444 100%);padding:36px 28px;text-align:center;border-radius:16px 16px 0 0;font-family:Arial,sans-serif;">
  <p style="font-size:40px;margin:0 0 8px 0;">📢</p>
  <h1 style="color:#ffffff;font-size:26px;margin:0 0 8px 0;">{{title}}</h1>
  <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:0;">Important update from the team</p>
</div>
<div style="background:#ffffff;padding:32px 28px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px;font-family:Arial,sans-serif;">
  <div style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:0 12px 12px 0;padding:20px;margin-bottom:24px;">
    <p style="color:#92400e;font-size:15px;line-height:1.7;margin:0;">{{description}}</p>
  </div>
  <p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 20px 0;">{{additional_details}}</p>
  <p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 24px 0;">If you have any questions, don't hesitate to reach out. We're here to help!</p>
  <div style="border-top:1px solid #f3f4f6;padding-top:20px;">
    <p style="color:#9ca3af;font-size:13px;margin:0;">Best regards,<br/><strong style="color:#374151;">The Team</strong></p>
  </div>
</div>`,
  },
  {
    id: 'feedback-friendly',
    name: 'Feedback — Friendly',
    category: 'General',
    subject: 'Hey! We\'d love your feedback 💬',
    html: `<div style="background:linear-gradient(135deg,#06b6d4 0%,#3b82f6 100%);padding:40px 28px;text-align:center;border-radius:16px 16px 0 0;font-family:Arial,sans-serif;">
  <p style="font-size:48px;margin:0 0 8px 0;">💬</p>
  <h1 style="color:#ffffff;font-size:26px;margin:0 0 8px 0;">We Value Your Opinion!</h1>
  <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:0;">Help us make things better for you</p>
</div>
<div style="background:#ffffff;padding:32px 28px;border:1px solid #e5e7eb;border-top:none;font-family:Arial,sans-serif;">
  <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 24px 0;">Your feedback helps us improve and serve you better. We'd appreciate just a few minutes of your time!</p>
  <div style="margin-bottom:24px;">
    <div style="display:flex;align-items:center;gap:12px;padding:14px 16px;background:#f0f9ff;border-radius:10px;margin-bottom:8px;">
      <span style="font-size:20px;">⭐</span>
      <p style="color:#1e40af;font-size:14px;font-weight:500;margin:0;">How has your experience been so far?</p>
    </div>
    <div style="display:flex;align-items:center;gap:12px;padding:14px 16px;background:#ecfdf5;border-radius:10px;margin-bottom:8px;">
      <span style="font-size:20px;">💡</span>
      <p style="color:#059669;font-size:14px;font-weight:500;margin:0;">What features would you like to see?</p>
    </div>
    <div style="display:flex;align-items:center;gap:12px;padding:14px 16px;background:#fdf4ff;border-radius:10px;">
      <span style="font-size:20px;">🔧</span>
      <p style="color:#7c3aed;font-size:14px;font-weight:500;margin:0;">Any suggestions for improvement?</p>
    </div>
  </div>
</div>
<div style="background:#f0f9ff;padding:24px 28px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px;text-align:center;font-family:Arial,sans-serif;">
  <a href="{{feedback_link}}" style="background:linear-gradient(135deg,#06b6d4,#3b82f6);color:#ffffff;padding:14px 48px;border-radius:50px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;box-shadow:0 4px 15px rgba(59,130,246,0.3);">Share Feedback →</a>
  <p style="color:#9ca3af;font-size:12px;margin:12px 0 0 0;">Thank you for being part of our community! 🙏</p>
</div>`,
  },
  {
    id: 'pitch-day',
    name: 'Startup Pitch Day — Bold',
    category: 'Events',
    subject: '🚀 Pitch Day: Present Your Startup!',
    html: `<div style="background:linear-gradient(135deg,#16a34a 0%,#0d9488 100%);padding:40px 28px;text-align:center;border-radius:16px 16px 0 0;font-family:Arial,sans-serif;">
  <p style="font-size:48px;margin:0 0 8px 0;">🚀</p>
  <h1 style="color:#ffffff;font-size:28px;margin:0 0 8px 0;">Startup Pitch Day</h1>
  <p style="color:rgba(255,255,255,0.85);font-size:15px;margin:0;">Your idea. Your stage. Your moment.</p>
</div>
<div style="background:#ffffff;padding:0;border:1px solid #e5e7eb;border-top:none;font-family:Arial,sans-serif;">
  <div style="display:flex;border-bottom:1px solid #f3f4f6;">
    <div style="flex:1;padding:20px;text-align:center;border-right:1px solid #f3f4f6;">
      <p style="font-size:20px;margin:0 0 4px 0;">📍</p>
      <p style="color:#9ca3af;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin:0 0 2px 0;">Venue</p>
      <p style="color:#1f2937;font-size:13px;font-weight:600;margin:0;">{{venue}}</p>
    </div>
    <div style="flex:1;padding:20px;text-align:center;border-right:1px solid #f3f4f6;">
      <p style="font-size:20px;margin:0 0 4px 0;">🗓️</p>
      <p style="color:#9ca3af;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin:0 0 2px 0;">Date</p>
      <p style="color:#1f2937;font-size:13px;font-weight:600;margin:0;">{{date}}</p>
    </div>
    <div style="flex:1;padding:20px;text-align:center;">
      <p style="font-size:20px;margin:0 0 4px 0;">🏅</p>
      <p style="color:#9ca3af;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin:0 0 2px 0;">Prizes</p>
      <p style="color:#1f2937;font-size:13px;font-weight:600;margin:0;">{{prizes}}</p>
    </div>
  </div>
  <div style="padding:28px;">
    <h3 style="color:#1f2937;font-size:15px;margin:0 0 12px 0;">What to Prepare</h3>
    <div style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:#ecfdf5;border-radius:8px;margin-bottom:6px;">
      <span style="color:#059669;font-weight:700;">✓</span>
      <p style="color:#374151;font-size:13px;margin:0;">A concise pitch deck (max 10 slides)</p>
    </div>
    <div style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:#ecfdf5;border-radius:8px;margin-bottom:6px;">
      <span style="color:#059669;font-weight:700;">✓</span>
      <p style="color:#374151;font-size:13px;margin:0;">Clear problem-solution statement</p>
    </div>
    <div style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:#ecfdf5;border-radius:8px;margin-bottom:6px;">
      <span style="color:#059669;font-weight:700;">✓</span>
      <p style="color:#374151;font-size:13px;margin:0;">Demo or prototype (if available)</p>
    </div>
    <div style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:#ecfdf5;border-radius:8px;">
      <span style="color:#059669;font-weight:700;">✓</span>
      <p style="color:#374151;font-size:13px;margin:0;">5 min pitch + Q&A with judges</p>
    </div>
  </div>
</div>
<div style="background:#f0fdf4;padding:24px 28px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px;text-align:center;font-family:Arial,sans-serif;">
  <a href="{{register_link}}" style="background:linear-gradient(135deg,#16a34a,#0d9488);color:#ffffff;padding:14px 48px;border-radius:50px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;box-shadow:0 4px 15px rgba(22,163,106,0.3);">Register to Pitch →</a>
</div>`,
  },
  {
    id: 'workshop-invite',
    name: 'Workshop Invitation — Blue',
    category: 'Events',
    subject: '🎓 Workshop: {{workshop_name}}',
    html: `<div style="background:linear-gradient(135deg,#1d4ed8 0%,#7c3aed 100%);padding:40px 28px;text-align:center;border-radius:16px 16px 0 0;font-family:Arial,sans-serif;"><p style="font-size:44px;margin:0 0 8px 0;">🎓</p><h1 style="color:#ffffff;font-size:26px;margin:0 0 8px 0;">{{workshop_name}}</h1><p style="color:rgba(255,255,255,0.85);font-size:14px;margin:0;">A hands-on learning experience</p></div><div style="background:#ffffff;padding:28px;border:1px solid #e5e7eb;border-top:none;font-family:Arial,sans-serif;"><div style="background:#eff6ff;border-radius:12px;padding:20px;margin-bottom:20px;"><div style="display:flex;gap:20px;flex-wrap:wrap;"><div style="flex:1;min-width:130px;"><p style="color:#6b7280;font-size:11px;text-transform:uppercase;margin:0 0 4px 0;">Instructor</p><p style="color:#1f2937;font-size:14px;font-weight:600;margin:0;">{{instructor}}</p></div><div style="flex:1;min-width:130px;"><p style="color:#6b7280;font-size:11px;text-transform:uppercase;margin:0 0 4px 0;">Date & Time</p><p style="color:#1f2937;font-size:14px;font-weight:600;margin:0;">{{date_time}}</p></div><div style="flex:1;min-width:130px;"><p style="color:#6b7280;font-size:11px;text-transform:uppercase;margin:0 0 4px 0;">Duration</p><p style="color:#1f2937;font-size:14px;font-weight:600;margin:0;">{{duration}}</p></div><div style="flex:1;min-width:130px;"><p style="color:#6b7280;font-size:11px;text-transform:uppercase;margin:0 0 4px 0;">Mode</p><p style="color:#1f2937;font-size:14px;font-weight:600;margin:0;">{{mode}}</p></div></div></div><h3 style="color:#1f2937;font-size:15px;margin:0 0 8px 0;">What You'll Learn</h3><ul style="color:#4b5563;font-size:14px;line-height:2;padding-left:20px;margin:0 0 8px 0;"><li>{{learning_1}}</li><li>{{learning_2}}</li><li>{{learning_3}}</li></ul><p style="color:#4b5563;font-size:14px;line-height:1.7;margin:16px 0 0 0;">{{workshop_description}}</p></div><div style="background:#eff6ff;padding:24px 28px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px;text-align:center;font-family:Arial,sans-serif;"><a href="{{register_link}}" style="background:linear-gradient(135deg,#1d4ed8,#7c3aed);color:#ffffff;padding:14px 48px;border-radius:50px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;box-shadow:0 4px 15px rgba(29,78,216,0.3);">Register Now →</a><p style="color:#6b7280;font-size:11px;margin:10px 0 0 0;">Limited seats available!</p></div>`,
  },
  {
    id: 'thank-you',
    name: 'Thank You / Appreciation',
    category: 'General',
    subject: '🙏 Thank You, {{name}}!',
    html: `<div style="background:linear-gradient(135deg,#f59e0b 0%,#f97316 100%);padding:40px 28px;text-align:center;border-radius:16px 16px 0 0;font-family:Arial,sans-serif;"><p style="font-size:48px;margin:0 0 12px 0;">🙏</p><h1 style="color:#ffffff;font-size:28px;margin:0 0 8px 0;">Thank You!</h1><p style="color:rgba(255,255,255,0.85);font-size:15px;margin:0;">Your support means the world to us</p></div><div style="background:#ffffff;padding:32px 28px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px;font-family:Arial,sans-serif;"><p style="color:#374151;font-size:16px;line-height:1.8;margin:0 0 20px 0;">Dear <strong>{{name}}</strong>,</p><p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 16px 0;">We want to take a moment to express our heartfelt gratitude for {{reason}}. Your contribution has made a real difference!</p><div style="background:linear-gradient(135deg,#fffbeb,#fef3c7);border-radius:12px;padding:24px;margin:20px 0;text-align:center;"><p style="color:#92400e;font-size:18px;font-weight:700;font-style:italic;margin:0;">"{{quote}}"</p></div><p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 20px 0;">We look forward to continuing this journey together. Here's to more amazing things ahead! 🌟</p><div style="border-top:1px solid #f3f4f6;padding-top:20px;"><p style="color:#9ca3af;font-size:13px;margin:0;">With warm regards,<br/><strong style="color:#374151;">The Team</strong></p></div></div>`,
  },
  {
    id: 'deadline-reminder',
    name: 'Deadline Reminder — Urgent',
    category: 'Reminders',
    subject: '⏰ Reminder: {{deadline_title}} ends soon!',
    html: `<div style="background:linear-gradient(135deg,#dc2626 0%,#f97316 100%);padding:36px 28px;text-align:center;border-radius:16px 16px 0 0;font-family:Arial,sans-serif;"><p style="font-size:44px;margin:0 0 8px 0;">⏰</p><h1 style="color:#ffffff;font-size:26px;margin:0 0 8px 0;">Don't Miss Out!</h1><p style="color:rgba(255,255,255,0.9);font-size:15px;margin:0;">Deadline approaching fast</p></div><div style="background:#ffffff;padding:28px;border:1px solid #e5e7eb;border-top:none;font-family:Arial,sans-serif;"><div style="background:#fef2f2;border:2px solid #fecaca;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;"><p style="color:#991b1b;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px 0;font-weight:700;">Deadline</p><p style="color:#dc2626;font-size:28px;font-weight:800;margin:0;">{{deadline_date}}</p><p style="color:#991b1b;font-size:13px;margin:8px 0 0 0;">Only <strong>{{days_left}}</strong> days left!</p></div><h3 style="color:#1f2937;font-size:16px;margin:0 0 8px 0;">{{deadline_title}}</h3><p style="color:#4b5563;font-size:14px;line-height:1.7;margin:0 0 20px 0;">{{deadline_description}}</p><p style="color:#4b5563;font-size:14px;line-height:1.7;margin:0 0 24px 0;">Don't wait until the last minute — submit your application now!</p></div><div style="background:#fef2f2;padding:24px 28px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px;text-align:center;font-family:Arial,sans-serif;"><a href="{{action_link}}" style="background:linear-gradient(135deg,#dc2626,#f97316);color:#ffffff;padding:14px 48px;border-radius:50px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;box-shadow:0 4px 15px rgba(220,38,38,0.35);">Take Action Now →</a></div>`,
  },
  {
    id: 'product-launch',
    name: 'Product / Feature Launch',
    category: 'Announcements',
    subject: '🎉 Introducing: {{feature_name}}',
    html: `<div style="background:linear-gradient(135deg,#0ea5e9 0%,#6366f1 50%,#a855f7 100%);padding:44px 28px;text-align:center;border-radius:16px 16px 0 0;font-family:Arial,sans-serif;"><p style="color:rgba(255,255,255,0.8);font-size:13px;text-transform:uppercase;letter-spacing:3px;margin:0 0 12px 0;font-weight:600;">🎉 Now Live</p><h1 style="color:#ffffff;font-size:30px;margin:0 0 10px 0;">{{feature_name}}</h1><p style="color:rgba(255,255,255,0.85);font-size:15px;margin:0;max-width:400px;display:inline-block;">{{feature_tagline}}</p></div><div style="background:#ffffff;padding:32px 28px;border:1px solid #e5e7eb;border-top:none;font-family:Arial,sans-serif;"><p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 24px 0;">{{feature_intro}}</p><h3 style="color:#1f2937;font-size:15px;margin:0 0 16px 0;">What's New</h3><div style="margin-bottom:10px;display:flex;align-items:flex-start;gap:12px;"><div style="background:#eff6ff;width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><span style="font-size:18px;">✨</span></div><div><p style="color:#1f2937;font-size:14px;font-weight:600;margin:0 0 2px 0;">{{feature_1_title}}</p><p style="color:#6b7280;font-size:13px;margin:0;">{{feature_1_desc}}</p></div></div><div style="margin-bottom:10px;display:flex;align-items:flex-start;gap:12px;"><div style="background:#f0fdf4;width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><span style="font-size:18px;">⚡</span></div><div><p style="color:#1f2937;font-size:14px;font-weight:600;margin:0 0 2px 0;">{{feature_2_title}}</p><p style="color:#6b7280;font-size:13px;margin:0;">{{feature_2_desc}}</p></div></div><div style="margin-bottom:10px;display:flex;align-items:flex-start;gap:12px;"><div style="background:#fdf4ff;width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><span style="font-size:18px;">🔥</span></div><div><p style="color:#1f2937;font-size:14px;font-weight:600;margin:0 0 2px 0;">{{feature_3_title}}</p><p style="color:#6b7280;font-size:13px;margin:0;">{{feature_3_desc}}</p></div></div></div><div style="background:linear-gradient(135deg,#f0f9ff,#f5f3ff);padding:24px 28px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px;text-align:center;font-family:Arial,sans-serif;"><a href="{{try_link}}" style="background:linear-gradient(135deg,#0ea5e9,#6366f1,#a855f7);color:#ffffff;padding:14px 48px;border-radius:50px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;box-shadow:0 4px 15px rgba(99,102,241,0.35);">Try It Now →</a></div>`,
  },
  {
    id: 'mentor-connect',
    name: 'Mentor Connect / 1-on-1',
    category: 'Opportunities',
    subject: '🧑‍🏫 Book Your 1-on-1 Mentorship Session',
    html: `<div style="background:linear-gradient(135deg,#0f766e 0%,#059669 100%);padding:40px 28px;text-align:center;border-radius:16px 16px 0 0;font-family:Arial,sans-serif;"><p style="font-size:44px;margin:0 0 8px 0;">🧑‍🏫</p><h1 style="color:#ffffff;font-size:26px;margin:0 0 8px 0;">Mentorship Sessions Open!</h1><p style="color:rgba(255,255,255,0.85);font-size:14px;margin:0;">Get personalized guidance from industry experts</p></div><div style="background:#ffffff;padding:28px;border:1px solid #e5e7eb;border-top:none;font-family:Arial,sans-serif;"><p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 24px 0;">Book a free 1-on-1 session with our mentors and get guidance on your startup journey, career path, or project ideas.</p><h3 style="color:#1f2937;font-size:15px;margin:0 0 14px 0;">Available Mentors</h3><div style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin-bottom:12px;"><div style="display:flex;align-items:center;gap:14px;padding:16px;background:#ecfdf5;"><div style="width:48px;height:48px;background:#059669;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:18px;">{{mentor_1_initial}}</div><div><p style="color:#1f2937;font-size:14px;font-weight:600;margin:0;">{{mentor_1_name}}</p><p style="color:#6b7280;font-size:12px;margin:2px 0 0 0;">{{mentor_1_expertise}}</p></div></div></div><div style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin-bottom:12px;"><div style="display:flex;align-items:center;gap:14px;padding:16px;background:#f0fdf4;"><div style="width:48px;height:48px;background:#0d9488;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:18px;">{{mentor_2_initial}}</div><div><p style="color:#1f2937;font-size:14px;font-weight:600;margin:0;">{{mentor_2_name}}</p><p style="color:#6b7280;font-size:12px;margin:2px 0 0 0;">{{mentor_2_expertise}}</p></div></div></div></div><div style="background:#ecfdf5;padding:24px 28px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px;text-align:center;font-family:Arial,sans-serif;"><a href="{{booking_link}}" style="background:linear-gradient(135deg,#0f766e,#059669);color:#ffffff;padding:14px 48px;border-radius:50px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;box-shadow:0 4px 15px rgba(5,150,105,0.3);">Book a Session →</a><p style="color:#6b7280;font-size:11px;margin:10px 0 0 0;">Sessions are free and limited — book early!</p></div>`,
  },
];

const TEMPLATE_CATEGORIES = [...new Set(EMAIL_TEMPLATES.map((t) => t.category))];

// ─── CC Email parser ─────────────────────────────────────────────

function parseCCEmails(text: string): string[] {
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return text
    .split(/[,;\s\n]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e && EMAIL_RE.test(e));
}

// ─── Component ───────────────────────────────────────────────────

export default function MailCompose({ role }: Props) {
  const router = useRouter();
  const basePath = `/${role}/mailer`;
  const editorRef = useRef<MailEditorRef>(null);

  const [boxes, setBoxes] = useState<BoxWithCount[]>([]);
  const [loadingBoxes, setLoadingBoxes] = useState(true);

  const [subject, setSubject] = useState('');
  const [selectedBoxIds, setSelectedBoxIds] = useState<string[]>([]);
  const [preview, setPreview] = useState(false);
  const [previewHTML, setPreviewHTML] = useState('');

  // CC state
  const [ccInput, setCcInput] = useState('');
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [showCc, setShowCc] = useState(false);

  // Template state
  const [showTemplates, setShowTemplates] = useState(false);
  const [templateCategory, setTemplateCategory] = useState('all');
  const [editorKey, setEditorKey] = useState(0);
  const [editorInitialHTML, setEditorInitialHTML] = useState('');

  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number; pendingApproval?: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    getMailBoxes()
      .then(setBoxes)
      .catch(console.error)
      .finally(() => setLoadingBoxes(false));
  }, []);

  const toggleBox = (id: string) => {
    setSelectedBoxIds((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  };

  const totalRecipients = boxes
    .filter((b) => selectedBoxIds.includes(b.id))
    .reduce((sum, b) => sum + b.email_count, 0);

  // ── CC handlers ────────────────────────────────────────────────
  function addCcEmails() {
    const parsed = parseCCEmails(ccInput);
    if (parsed.length === 0) return;
    setCcEmails((prev) => [...new Set([...prev, ...parsed])]);
    setCcInput('');
  }

  function removeCcEmail(email: string) {
    setCcEmails((prev) => prev.filter((e) => e !== email));
  }

  function handleCcKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addCcEmails();
    }
  }

  // ── Template handler ───────────────────────────────────────────
  function applyTemplate(template: EmailTemplate) {
    setSubject(template.subject);
    // Force editor to re-mount with new template content
    setEditorInitialHTML(template.html);
    setEditorKey((k) => k + 1);
    setShowTemplates(false);
  }

  const filteredTemplates = templateCategory === 'all'
    ? EMAIL_TEMPLATES
    : EMAIL_TEMPLATES.filter((t) => t.category === templateCategory);

  // ── Send handlers ──────────────────────────────────────────────
  const handlePreview = () => {
    if (editorRef.current) {
      setPreviewHTML(editorRef.current.getHTML());
    }
    setPreview(!preview);
  };

  const handleSendClick = () => {
    setError(null);
    if (!subject.trim()) { setError('Subject is required'); return; }
    if (selectedBoxIds.length === 0) { setError('Select at least one mail box'); return; }
    const html = editorRef.current?.getHTML() ?? '';
    if (!html.trim() || html === '<br>') { setError('Email body is required'); return; }
    setPreviewHTML(html);
    setShowConfirm(true);
  };

  const handleConfirmSend = async () => {
    setShowConfirm(false);
    setSending(true);
    setError(null);
    setResult(null);
    try {
      const html = previewHTML || editorRef.current?.getHTML() || '';
      if (!html.trim()) { setError('Email body is required'); setSending(false); return; }
      const res = await sendCampaign({
        subject: subject.trim(),
        htmlBody: html,
        boxIds: selectedBoxIds,
        ccEmails: ccEmails.length > 0 ? ccEmails : undefined,
      });
      setResult({ sent: res.sent, failed: res.failed, pendingApproval: res.pendingApproval });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <Link href={basePath} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary transition-colors mb-4">
        <ArrowLeft size={15} />
        Back to Mailer
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Compose Email</h1>
          <p className="mt-1 text-sm text-muted">Design your email and select recipients</p>
        </div>
        <button
          type="button"
          onClick={() => setShowTemplates(!showTemplates)}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
            showTemplates
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-card-border bg-card-bg text-muted hover:text-foreground'
          }`}
        >
          <FileText size={14} />
          Templates
        </button>
      </div>

      {/* ── Template Picker ───────────────────────────────────────── */}
      {showTemplates && (
        <div className="mb-6 rounded-xl border border-card-border bg-card-bg p-5 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Choose a Template</h2>
            <button type="button" onClick={() => setShowTemplates(false)} className="text-muted hover:text-foreground">
              <X size={16} />
            </button>
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setTemplateCategory('all')}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                templateCategory === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-card-border/30 text-muted hover:text-foreground'
              }`}
            >
              All
            </button>
            {TEMPLATE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setTemplateCategory(cat)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  templateCategory === cat
                    ? 'bg-primary text-white'
                    : 'bg-card-border/30 text-muted hover:text-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Template cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredTemplates.map((tmpl) => (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => applyTemplate(tmpl)}
                className="group text-left rounded-xl border border-card-border p-4 transition-all hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      {tmpl.name}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted truncate">{tmpl.subject}</p>
                    <span className="mt-1.5 inline-block rounded-full bg-card-border/40 px-2 py-0.5 text-[10px] font-medium text-muted">
                      {tmpl.category}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <p className="text-[11px] text-muted">
            Click a template to load it. Replace <code className="text-primary">{'{{placeholders}}'}</code> with your actual content.
          </p>
        </div>
      )}

      {result ? (
        <div className="card-elevated rounded-xl p-8 text-center">
          {result.pendingApproval ? (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 mx-auto mb-4">
                <Clock size={32} className="text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Submitted for Approval</h2>
              <p className="mt-2 text-muted">
                Your campaign <strong className="text-foreground">&quot;{subject}&quot;</strong> has been submitted and is waiting for Super Admin approval.
                You will be notified once it is approved and sent.
              </p>
            </>
          ) : (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 mx-auto mb-4">
                <Check size={32} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Campaign Sent!</h2>
              <p className="mt-2 text-muted">
                Successfully sent to <strong className="text-foreground">{result.sent}</strong> recipient{result.sent === 1 ? '' : 's'}.
                {result.failed > 0 && (
                  <span className="text-red-500"> {result.failed} failed.</span>
                )}
                {ccEmails.length > 0 && (
                  <span className="block mt-1 text-sm">CC'd to {ccEmails.length} address{ccEmails.length !== 1 ? 'es' : ''}.</span>
                )}
              </p>
            </>
          )}
          <div className="mt-6 flex gap-3 justify-center">
            <Link href={basePath} className="btn-secondary">
              Back to Mailer
            </Link>
            <Link href={`${basePath}/history`} className="btn-primary">
              View History
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 p-4 text-sm text-danger">
              {error}
            </div>
          )}

          {/* Subject */}
          <div className="card-elevated rounded-xl p-6">
            <label className="mb-1.5 block text-sm font-medium text-foreground">Subject *</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject..."
              className="w-full rounded-xl border border-card-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* CC Field */}
          <div className="card-elevated rounded-xl p-6">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-foreground">
                CC (Carbon Copy)
                {ccEmails.length > 0 && (
                  <span className="ml-2 text-xs text-muted font-normal">({ccEmails.length} added)</span>
                )}
              </label>
              {!showCc && ccEmails.length === 0 && (
                <button
                  type="button"
                  onClick={() => setShowCc(true)}
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <Plus size={12} /> Add CC
                </button>
              )}
            </div>

            {(showCc || ccEmails.length > 0) && (
              <div className="space-y-2.5">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={ccInput}
                    onChange={(e) => setCcInput(e.target.value)}
                    onKeyDown={handleCcKeyDown}
                    onBlur={addCcEmails}
                    placeholder="Enter CC emails (comma or Enter to add)..."
                    className="flex-1 rounded-xl border border-card-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={addCcEmails}
                    disabled={!ccInput.trim()}
                    className="flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/20 disabled:opacity-40 transition-colors"
                  >
                    <Plus size={14} /> Add
                  </button>
                </div>

                {ccEmails.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {ccEmails.map((email) => (
                      <span
                        key={email}
                        className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                      >
                        {email}
                        <button
                          type="button"
                          onClick={() => removeCcEmail(email)}
                          className="ml-0.5 rounded-full p-0.5 hover:bg-primary/20 transition-colors"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-[11px] text-muted">
                  CC recipients will receive a copy of every email. They will be visible to all recipients.
                </p>
              </div>
            )}
          </div>

          {/* Select Boxes */}
          <div className="card-elevated rounded-xl p-6">
            <label className="mb-3 block text-sm font-medium text-foreground">
              Select Mail Boxes *
              {selectedBoxIds.length > 0 && (
                <span className="ml-2 text-xs text-muted font-normal">
                  ({selectedBoxIds.length} selected, ~{totalRecipients} recipients)
                </span>
              )}
            </label>

            {loadingBoxes ? (
              <div className="flex items-center gap-2 py-4 text-muted text-sm">
                <Loader2 size={16} className="animate-spin" />
                Loading boxes...
              </div>
            ) : boxes.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-sm text-muted">No mail boxes found.</p>
                <Link href={basePath} className="text-sm text-primary hover:underline mt-1 inline-block">
                  Create a mail box first
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {boxes.map((box) => {
                  const selected = selectedBoxIds.includes(box.id);
                  return (
                    <button
                      key={box.id}
                      type="button"
                      onClick={() => toggleBox(box.id)}
                      className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                        selected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                          : 'border-card-border hover:border-card-border/80 hover:bg-card-border/5'
                      }`}
                    >
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all ${
                          selected ? 'border-primary bg-primary' : 'border-card-border bg-background'
                        }`}
                      >
                        {selected && <Check size={12} className="text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{box.name}</p>
                        <p className="text-[11px] text-muted">{box.email_count} emails</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Editor */}
          <div className="card-elevated rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-foreground">Email Body *</label>
              <button
                type="button"
                onClick={handlePreview}
                className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                {preview ? <EyeOff size={13} /> : <Eye size={13} />}
                {preview ? 'Edit' : 'Preview'}
              </button>
            </div>

            {preview ? (
              <div className="rounded-xl border border-card-border bg-white dark:bg-slate-900 p-6 min-h-[300px]">
                <div
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: previewHTML }}
                />
              </div>
            ) : (
              <MailEditor key={editorKey} ref={editorRef} initialHTML={editorInitialHTML} />
            )}
          </div>

          {/* Send Button */}
          <div className="flex items-center gap-3 pt-2 pb-8">
            <button
              onClick={handleSendClick}
              disabled={sending}
              className="btn-primary flex items-center gap-2"
            >
              {sending ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={15} />
                  Send Campaign
                </>
              )}
            </button>
            <button onClick={() => router.back()} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-background p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Mail size={24} className="text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Confirm Send</h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">
                You are about to send <strong className="text-foreground">&quot;{subject}&quot;</strong> to approximately{' '}
                <strong className="text-foreground">{totalRecipients}</strong> recipient{totalRecipients === 1 ? '' : 's'} across{' '}
                {selectedBoxIds.length} box{selectedBoxIds.length === 1 ? '' : 'es'}.
              </p>
              {ccEmails.length > 0 && (
                <p className="mt-1.5 text-sm text-muted">
                  <strong className="text-foreground">{ccEmails.length}</strong> CC recipient{ccEmails.length !== 1 ? 's' : ''} will also receive a copy.
                </p>
              )}
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button onClick={handleConfirmSend} className="btn-primary flex-1">
                Send Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
