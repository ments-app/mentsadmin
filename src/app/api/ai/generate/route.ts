import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { scrapeWebsite } from '@/lib/scraper';

const getGroq = () => new Groq({ apiKey: process.env.GROQ_API_KEY! });

type FieldType =
  | 'description'
  | 'responsibilities'
  | 'requirements'
  | 'benefits'
  | 'deliverables'
  | 'eligibility'
  | 'tags';

// ── Prompts ────────────────────────────────────────────────────────

const JOB_PROMPTS: Record<FieldType, (ctx: Record<string, string>) => string> = {
  description: (ctx) => {
    const websiteInfo = ctx._website_content
      ? `\n\nHere is real information scraped from the company website (${ctx.company_website}):\n---\n${ctx._website_content}\n---\nUse this information to write an accurate company intro paragraph. Pull real facts about what the company does, their mission, products, and culture from this content. Do NOT make up company details — only use what is provided above.`
      : '';

    return `Write a compelling job description for a ${ctx.experience_level || ''} ${ctx.job_type || 'full-time'} ${ctx.title || 'role'} position at ${ctx.company || 'a company'}${ctx.category ? ` in the ${ctx.category} field` : ''}${ctx.location ? ` located in ${ctx.location}` : ''}${ctx.work_mode ? `, ${ctx.work_mode} work` : ''}.${websiteInfo}

Start with a brief company intro paragraph (use real details from the website if available), then describe what the role is about, and why someone would want to join.
Keep it professional, concise (150-250 words), and engaging. Use plain text, no markdown headers.`;
  },

  responsibilities: (ctx) =>
    `Write a list of 6-8 key day-to-day responsibilities for a ${ctx.experience_level || ''} ${ctx.title || 'role'} at ${ctx.company || 'a company'}${ctx.category ? ` in ${ctx.category}` : ''}.
${ctx.description ? `Context about the role: ${ctx.description.slice(0, 300)}` : ''}
Write each responsibility on a new line starting with "- ". Be specific and actionable.`,

  requirements: (ctx) =>
    `Write a list of 6-8 requirements/qualifications for a ${ctx.experience_level || ''} ${ctx.title || 'role'} at ${ctx.company || 'a company'}${ctx.category ? ` in ${ctx.category}` : ''}.
${ctx.skills_required ? `Required skills include: ${ctx.skills_required}` : ''}
${ctx.description ? `Role context: ${ctx.description.slice(0, 300)}` : ''}
Include education, years of experience, technical skills, and soft skills. Write each on a new line starting with "- ".`,

  benefits: (ctx) =>
    `Write a list of 8-10 attractive benefits and perks for a ${ctx.job_type || 'full-time'} ${ctx.title || 'role'} at ${ctx.company || 'a company'}${ctx.work_mode === 'remote' ? ' (remote position)' : ''}.
Include compensation-related benefits, health/wellness, work-life balance, and growth opportunities.
Write each on a new line starting with "- ". Be specific and appealing.`,

  deliverables: (ctx) =>
    `Write a clear list of 5-7 expected deliverables for a ${ctx.title || 'gig'}${ctx.category ? ` in ${ctx.category}` : ''} with a budget of ${ctx.budget || 'negotiable'} and duration of ${ctx.duration || 'flexible'}.
${ctx.description ? `Context: ${ctx.description.slice(0, 300)}` : ''}
${ctx.skills_required ? `Skills involved: ${ctx.skills_required}` : ''}
Write each deliverable on a new line starting with "- ". Be concrete and measurable.`,
};

const GIG_PROMPTS: Record<FieldType, (ctx: Record<string, string>) => string> = {
  description: (ctx) => {
    const websiteInfo = ctx._website_content
      ? `\n\nHere is real information scraped from the client's website (${ctx.company_website}):\n---\n${ctx._website_content}\n---\nUse this information to write an accurate intro about the client. Pull real facts about what the company does from this content. Do NOT make up company details.`
      : '';

    return `Write a clear and attractive gig/freelance project description for: "${ctx.title || 'a project'}"${ctx.company ? ` by ${ctx.company}` : ''}${ctx.category ? ` in the ${ctx.category} field` : ''}.
Budget: ${ctx.budget || 'negotiable'}. Duration: ${ctx.duration || 'flexible'}. Payment: ${ctx.payment_type || 'fixed price'}.
${ctx.skills_required ? `Skills needed: ${ctx.skills_required}` : ''}${websiteInfo}

Start with a brief intro about the client (use real details from the website if available), then describe the project, ideal freelancer profile, and what success looks like.
Keep it professional and concise (120-200 words). Use plain text, no markdown headers.`;
  },

  responsibilities: (ctx) =>
    `Write a clear scope of work with 5-7 tasks for a freelance gig: "${ctx.title || 'project'}"${ctx.category ? ` in ${ctx.category}` : ''}.
${ctx.description ? `Project context: ${ctx.description.slice(0, 300)}` : ''}
${ctx.skills_required ? `Skills involved: ${ctx.skills_required}` : ''}
Duration: ${ctx.duration || 'flexible'}.
Write each task on a new line starting with "- ". Be specific about what needs to be done.`,

  requirements: (ctx) =>
    `Write 5-6 requirements for a freelancer applying to: "${ctx.title || 'a gig'}"${ctx.category ? ` in ${ctx.category}` : ''}.
Experience level: ${ctx.experience_level || 'any'}
${ctx.skills_required ? `Skills: ${ctx.skills_required}` : ''}
Write each on a new line starting with "- ". Include portfolio/experience expectations.`,

  benefits: (ctx) =>
    `Write 4-5 reasons why a freelancer should take this gig: "${ctx.title || 'project'}"${ctx.company ? ` with ${ctx.company}` : ''}.
Budget: ${ctx.budget || 'negotiable'}. Payment: ${ctx.payment_type || 'fixed'}.
Write each on a new line starting with "- ".`,

  deliverables: (ctx) =>
    `Write a clear list of 5-7 specific deliverables expected for a freelance gig: "${ctx.title || 'project'}"${ctx.category ? ` in ${ctx.category}` : ''}.
${ctx.description ? `Context: ${ctx.description.slice(0, 300)}` : ''}
${ctx.skills_required ? `Skills: ${ctx.skills_required}` : ''}
Duration: ${ctx.duration || 'flexible'}. Budget: ${ctx.budget || 'negotiable'}.
Write each deliverable on a new line starting with "- ". Be concrete and measurable.`,
};

const RESOURCE_PROMPTS: Record<FieldType, (ctx: Record<string, string>) => string> = {
  description: (ctx) => {
    const websiteInfo = ctx._website_content
      ? `\n\nHere is real information scraped from the resource URL (${ctx.url}):\n---\n${ctx._website_content}\n---\nUse this information to write an accurate description. Pull real facts from this content. Do NOT make up details.`
      : '';

    return `Write a clear and informative description for a ${ctx.category?.replace(/_/g, ' ') || 'resource'} titled "${ctx.title || 'a resource'}"${ctx.provider ? ` provided by ${ctx.provider}` : ''}.${websiteInfo}

Explain what this resource offers, who it's for, and why it's valuable. Keep it professional and concise (80-150 words). Use plain text, no markdown headers.`;
  },

  eligibility: (ctx) =>
    `Write clear eligibility criteria for a ${ctx.category?.replace(/_/g, ' ') || 'resource'} titled "${ctx.title || 'a resource'}"${ctx.provider ? ` by ${ctx.provider}` : ''}.
${ctx.description ? `Context: ${ctx.description.slice(0, 400)}` : ''}
${ctx.tags ? `Related tags: ${ctx.tags}` : ''}
${ctx._website_content ? `Website info:\n${ctx._website_content.slice(0, 800)}` : ''}

Write each criterion on a new line starting with "- ". Include who can apply, any requirements (age, location, stage, revenue, etc.), and any restrictions. Be specific and practical. 5-7 points.`,

  tags: (ctx) =>
    `Generate 6-10 relevant comma-separated tags for a ${ctx.category?.replace(/_/g, ' ') || 'resource'} titled "${ctx.title || 'a resource'}"${ctx.provider ? ` by ${ctx.provider}` : ''}.
${ctx.description ? `Description: ${ctx.description.slice(0, 300)}` : ''}
${ctx.eligibility ? `Eligibility: ${ctx.eligibility.slice(0, 200)}` : ''}

Return ONLY comma-separated lowercase tags, no bullet points, no numbering. Example: startup, funding, seed stage, india, technology`,

  responsibilities: (ctx) =>
    `Write 5-7 key points about what "${ctx.title || 'this resource'}" provides. Write each on a new line starting with "- ".`,

  requirements: (ctx) =>
    `Write 5-6 requirements to access "${ctx.title || 'this resource'}"${ctx.provider ? ` from ${ctx.provider}` : ''}. Write each on a new line starting with "- ".`,

  benefits: (ctx) =>
    `Write 5-6 key benefits of "${ctx.title || 'this resource'}"${ctx.provider ? ` by ${ctx.provider}` : ''}. Write each on a new line starting with "- ".`,

  deliverables: (ctx) =>
    `Write 4-5 deliverables or outcomes from "${ctx.title || 'this resource'}". Write each on a new line starting with "- ".`,
};

// ── Main handler ───────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { field, type, context } = body as {
      field: FieldType;
      type: 'job' | 'gig' | 'resource';
      context: Record<string, string>;
    };

    if (!field || !type || !context) {
      return NextResponse.json(
        { error: 'Missing required fields: field, type, context' },
        { status: 400 }
      );
    }

    // For description/eligibility fields, scrape the website for real context
    if ((field === 'description' || field === 'eligibility') && (context.company_website || context.url)) {
      const urlToScrape = context.company_website || context.url;
      const websiteContent = await scrapeWebsite(urlToScrape);
      if (websiteContent) {
        context._website_content = websiteContent;
      }
    }

    const prompts = type === 'job' ? JOB_PROMPTS : type === 'resource' ? RESOURCE_PROMPTS : GIG_PROMPTS;
    const promptFn = prompts[field];
    if (!promptFn) {
      return NextResponse.json(
        { error: `Unknown field: ${field}` },
        { status: 400 }
      );
    }

    const prompt = promptFn(context);

    const chatCompletion = await getGroq().chat.completions.create({
      messages: [
        {
          role: 'system',
          content:
            'You are a professional HR and recruitment content writer. Write clear, engaging, and professional content. Output plain text only — no markdown formatting, no headers, no bold/italic. Just clean readable text. When company website information is provided, use those REAL facts to write the company intro — never invent company details.',
        },
        { role: 'user', content: prompt },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 1024,
    });

    const text = chatCompletion.choices?.[0]?.message?.content?.trim() || '';

    return NextResponse.json({ text });
  } catch (e: unknown) {
    console.error('AI generate error:', e);
    const msg = e instanceof Error ? e.message : 'AI generation failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
