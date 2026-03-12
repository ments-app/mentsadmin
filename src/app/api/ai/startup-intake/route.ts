import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_URL = 'https://api.openai.com/v1/responses';
const OPENAI_FILES_URL = 'https://api.openai.com/v1/files';
const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-5';
const MAX_FILE_BYTES = 10 * 1024 * 1024;

const legalStatusValues = ['llp', 'pvt_ltd', 'sole_proprietorship', 'not_registered', ''] as const;
const stageValues = ['ideation', 'mvp', 'scaling', 'expansion', 'maturity', ''] as const;
const fundingStageValues = ['pre_seed', 'seed', 'series_a', 'series_b', 'series_c', 'bridge', ''] as const;
const revenueCurrencies = ['INR', 'USD', 'EUR', 'GBP', 'SGD', 'AED', ''] as const;

type StartupExtraction = {
  brand_name: string;
  registered_name: string;
  legal_status: (typeof legalStatusValues)[number];
  cin: string;
  stage: (typeof stageValues)[number];
  description: string;
  startup_email: string;
  startup_phone: string;
  website: string;
  founded_date: string;
  city: string;
  state: string;
  country: string;
  address_line1: string;
  address_line2: string;
  business_model: string;
  key_strengths: string;
  target_audience: string;
  elevator_pitch: string;
  revenue_amount: string;
  revenue_currency: (typeof revenueCurrencies)[number];
  revenue_growth: string;
  traction_metrics: string;
  total_raised: string;
  investor_count: string;
  raise_target: string;
  equity_offered: string;
  min_ticket_size: string;
  funding_stage: (typeof fundingStageValues)[number];
  team_size: string;
  sector: string;
  pitch_video_url: string;
  is_actively_raising: boolean;
  categories: string[];
  keywords: string[];
  founders: Array<{
    name: string;
    role: string;
    email: string;
    ments_username: string;
  }>;
  extraction_notes: string;
};

const schema = {
  name: 'startup_intake',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      brand_name: { type: 'string' },
      registered_name: { type: 'string' },
      legal_status: { type: 'string', enum: [...legalStatusValues] },
      cin: { type: 'string' },
      stage: { type: 'string', enum: [...stageValues] },
      description: { type: 'string' },
      startup_email: { type: 'string' },
      startup_phone: { type: 'string' },
      website: { type: 'string' },
      founded_date: { type: 'string', description: 'Use YYYY-MM-DD when known, else empty string.' },
      city: { type: 'string' },
      state: { type: 'string' },
      country: { type: 'string' },
      address_line1: { type: 'string' },
      address_line2: { type: 'string' },
      business_model: { type: 'string' },
      key_strengths: { type: 'string' },
      target_audience: { type: 'string' },
      elevator_pitch: { type: 'string' },
      revenue_amount: { type: 'string' },
      revenue_currency: { type: 'string', enum: [...revenueCurrencies] },
      revenue_growth: { type: 'string' },
      traction_metrics: { type: 'string' },
      total_raised: { type: 'string' },
      investor_count: { type: 'string' },
      raise_target: { type: 'string' },
      equity_offered: { type: 'string' },
      min_ticket_size: { type: 'string' },
      funding_stage: { type: 'string', enum: [...fundingStageValues] },
      team_size: { type: 'string' },
      sector: { type: 'string' },
      pitch_video_url: { type: 'string' },
      is_actively_raising: { type: 'boolean' },
      categories: {
        type: 'array',
        items: { type: 'string' },
      },
      keywords: {
        type: 'array',
        items: { type: 'string' },
      },
      founders: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            name: { type: 'string' },
            role: { type: 'string' },
            email: { type: 'string' },
            ments_username: { type: 'string' },
          },
          required: ['name', 'role', 'email', 'ments_username'],
        },
      },
      extraction_notes: { type: 'string' },
    },
    required: [
      'brand_name',
      'registered_name',
      'legal_status',
      'cin',
      'stage',
      'description',
      'startup_email',
      'startup_phone',
      'website',
      'founded_date',
      'city',
      'state',
      'country',
      'address_line1',
      'address_line2',
      'business_model',
      'key_strengths',
      'target_audience',
      'elevator_pitch',
      'revenue_amount',
      'revenue_currency',
      'revenue_growth',
      'traction_metrics',
      'total_raised',
      'investor_count',
      'raise_target',
      'equity_offered',
      'min_ticket_size',
      'funding_stage',
      'team_size',
      'sector',
      'pitch_video_url',
      'is_actively_raising',
      'categories',
      'keywords',
      'founders',
      'extraction_notes',
    ],
  },
};

function getMimeType(file: File) {
  if (file.type) return file.type;
  if (file.name.toLowerCase().endsWith('.pdf')) return 'application/pdf';
  return 'application/octet-stream';
}

function buildPrompt(fileName: string) {
  return [
    `Extract startup profile data from the uploaded file "${fileName}".`,
    'The file may be a pitch deck, brochure, one-pager, poster, or profile PDF/image.',
    'Return only facts clearly supported by the file. If a value is missing or uncertain, return an empty string, empty array, or false.',
    'Use these enums only when supported by the document:',
    `legal_status: ${legalStatusValues.join(', ')}`,
    `stage: ${stageValues.join(', ')}`,
    `funding_stage: ${fundingStageValues.join(', ')}`,
    `revenue_currency: ${revenueCurrencies.join(', ')}`,
    'For founded_date, use YYYY-MM-DD only if the exact date is present. If only a year is present, leave it empty.',
    'For categories and keywords, infer a short list only when strongly supported by the document.',
    'For founders, extract founder/co-founder/team member details only if explicitly stated.',
    'For ments_username, only fill it if the file explicitly includes a Ments username. Do not guess from LinkedIn or other social handles.',
    'extraction_notes should briefly say what was confidently extracted and what remained missing.',
  ].join('\n');
}

function sanitizeExtraction(data: StartupExtraction): StartupExtraction {
  return {
    ...data,
    brand_name: data.brand_name.trim(),
    registered_name: data.registered_name.trim(),
    cin: data.cin.trim(),
    description: data.description.trim(),
    startup_email: data.startup_email.trim(),
    startup_phone: data.startup_phone.trim(),
    website: data.website.trim(),
    founded_date: /^\d{4}-\d{2}-\d{2}$/.test(data.founded_date.trim()) ? data.founded_date.trim() : '',
    city: data.city.trim(),
    state: data.state.trim(),
    country: data.country.trim(),
    address_line1: data.address_line1.trim(),
    address_line2: data.address_line2.trim(),
    business_model: data.business_model.trim(),
    key_strengths: data.key_strengths.trim(),
    target_audience: data.target_audience.trim(),
    elevator_pitch: data.elevator_pitch.trim(),
    revenue_amount: data.revenue_amount.trim(),
    revenue_growth: data.revenue_growth.trim(),
    traction_metrics: data.traction_metrics.trim(),
    total_raised: data.total_raised.trim(),
    investor_count: data.investor_count.trim().replace(/[^\d]/g, ''),
    raise_target: data.raise_target.trim(),
    equity_offered: data.equity_offered.trim(),
    min_ticket_size: data.min_ticket_size.trim(),
    team_size: data.team_size.trim(),
    sector: data.sector.trim(),
    pitch_video_url: data.pitch_video_url.trim(),
    categories: data.categories.map((item) => item.trim()).filter(Boolean).slice(0, 8),
    keywords: data.keywords.map((item) => item.trim()).filter(Boolean).slice(0, 12),
    founders: data.founders
      .map((founder) => ({
        name: founder.name.trim(),
        role: founder.role.trim(),
        email: founder.email.trim(),
        ments_username: founder.ments_username.trim(),
      }))
      .filter((founder) => founder.name),
    extraction_notes: data.extraction_notes.trim(),
  };
}

function extractResponseText(payload: unknown) {
  if (!payload || typeof payload !== 'object') return '';

  const direct = (payload as { output_text?: unknown }).output_text;
  if (typeof direct === 'string' && direct.trim()) return direct.trim();

  const output = (payload as { output?: unknown }).output;
  if (!Array.isArray(output)) return '';

  for (const item of output) {
    if (!item || typeof item !== 'object') continue;
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;

    for (const part of content) {
      if (!part || typeof part !== 'object') continue;
      const typedPart = part as { type?: unknown; text?: unknown };
      if (
        (typedPart.type === 'output_text' || typedPart.type === 'text') &&
        typeof typedPart.text === 'string' &&
        typedPart.text.trim()
      ) {
        return typedPart.text.trim();
      }
    }
  }

  return '';
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY is not configured' }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'A PDF or image file is required' }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json({ error: 'The uploaded file is empty' }, { status: 400 });
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: 'Please upload a file smaller than 10 MB' }, { status: 400 });
    }

    const mimeType = getMimeType(file);
    const allowedMimeTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];
    if (!allowedMimeTypes.includes(mimeType)) {
      return NextResponse.json({ error: 'Only PDF, PNG, JPG, and WebP files are supported' }, { status: 400 });
    }

    let fileInput:
      | { type: 'input_file'; file_id: string }
      | { type: 'input_image'; image_url: string; detail: 'high' };

    if (mimeType === 'application/pdf') {
      const uploadForm = new FormData();
      uploadForm.append('purpose', 'user_data');
      uploadForm.append('file', file, file.name || 'startup.pdf');

      const uploadResponse = await fetch(OPENAI_FILES_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: uploadForm,
      });

      const uploadPayload = await uploadResponse.json();
      if (!uploadResponse.ok) {
        const message =
          uploadPayload?.error?.message ||
          uploadPayload?.error ||
          'OpenAI file upload failed';
        return NextResponse.json({ error: message }, { status: uploadResponse.status });
      }

      if (!uploadPayload?.id) {
        return NextResponse.json({ error: 'OpenAI file upload did not return a file ID' }, { status: 422 });
      }

      fileInput = {
        type: 'input_file',
        file_id: uploadPayload.id as string,
      };
    } else {
      const bytes = Buffer.from(await file.arrayBuffer());
      const base64 = bytes.toString('base64');
      fileInput = {
            type: 'input_image' as const,
            image_url: `data:${mimeType};base64,${base64}`,
            detail: 'high' as const,
          };
    }

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        input: [
          {
            role: 'user',
            content: [
              { type: 'input_text', text: buildPrompt(file.name) },
              fileInput,
            ],
          },
        ],
        text: {
          format: {
            type: 'json_schema',
            ...schema,
          },
        },
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      const message =
        payload?.error?.message ||
        payload?.error ||
        'OpenAI extraction failed';
      return NextResponse.json({ error: message }, { status: response.status });
    }

    const outputText = extractResponseText(payload);
    if (!outputText) {
      return NextResponse.json(
        {
          error: 'OpenAI returned an empty response',
          status: typeof payload?.status === 'string' ? payload.status : undefined,
        },
        { status: 422 }
      );
    }

    const extracted = sanitizeExtraction(JSON.parse(outputText) as StartupExtraction);
    return NextResponse.json({ data: extracted });
  } catch (error) {
    console.error('startup-intake error:', error);
    const message = error instanceof Error ? error.message : 'Startup extraction failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
