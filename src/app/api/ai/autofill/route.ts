import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { scrapeWebsite } from '@/lib/scraper';
import { CATEGORY_METADATA_FIELDS } from '@/lib/category-metadata';

const getGroq = () => new Groq({ apiKey: process.env.GROQ_API_KEY! });

const VALID_CATEGORIES = ['govt_scheme', 'accelerator_incubator', 'company_offer', 'tool', 'bank_offer', 'scheme'];

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'GROQ_API_KEY is not configured' }, { status: 500 });
    }

    const body = await req.json();
    const { url, category } = body as { url: string; category?: string };

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const scrapedContent = await scrapeWebsite(url);
    if (!scrapedContent) {
      return NextResponse.json({ error: 'Could not fetch content from URL' }, { status: 422 });
    }

    // Build the list of metadata fields the AI should extract
    const metadataFieldsList = VALID_CATEGORIES.map((cat) => {
      const fields = CATEGORY_METADATA_FIELDS[cat];
      if (!fields) return null;
      return `For category "${cat}": ${fields.map((f) => f.key).join(', ')}`;
    }).filter(Boolean).join('\n');

    const prompt = `You are extracting structured data from a website to create a resource listing on a startup platform.

Website content:
---
${scrapedContent}
---

${category ? `The user indicated this is likely category: "${category}".` : 'Auto-detect the most appropriate category.'}

Valid categories: ${VALID_CATEGORIES.join(', ')}

Category-specific metadata fields:
${metadataFieldsList}

Return a JSON object with these fields:
- title: string (the resource/company/scheme name)
- description: string (2-4 sentence description of what this resource offers)
- category: string (one of the valid categories)
- provider: string (the organization providing this resource)
- eligibility: string (who can use this, bullet points with "- " prefix)
- tags: string[] (6-10 relevant lowercase tags)
- metadata: object (fill in relevant metadata fields for the detected category, only include fields that have values from the content)

Return ONLY valid JSON, no markdown, no explanation.`;

    const chatCompletion = await getGroq().chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a precise data extraction assistant. You extract structured information from website content and return clean JSON. Never invent information that is not present in the provided content.',
        },
        { role: 'user', content: prompt },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 1024,
    });

    const text = chatCompletion.choices?.[0]?.message?.content?.trim() || '';

    // Parse the JSON response
    let parsed: Record<string, unknown>;
    try {
      // Try to extract JSON from possible markdown code blocks
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
      parsed = JSON.parse(jsonMatch[1]!.trim());
    } catch {
      return NextResponse.json({ error: 'AI returned invalid JSON', raw: text }, { status: 422 });
    }

    // Validate category
    if (parsed.category && !VALID_CATEGORIES.includes(parsed.category as string)) {
      parsed.category = category || 'scheme';
    }

    return NextResponse.json({ data: parsed });
  } catch (e: unknown) {
    console.error('AI autofill error:', e);
    const msg = e instanceof Error ? e.message : 'Auto-fill failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
