export type FieldDef = {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select';
  placeholder: string;
  options?: { value: string; label: string }[];
};

export const CATEGORY_METADATA_LABELS: Record<string, string> = {
  scheme: 'Scheme Details',
  govt_scheme: 'Scheme Details',
  accelerator_incubator: 'Accelerator / Incubator Details',
  company_offer: 'Offer Details',
  tool: 'Tool Details',
  bank_offer: 'Bank Offer Details',
};

const SCHEME_FIELDS: FieldDef[] = [
  { key: 'location', label: 'Location', type: 'text', placeholder: 'e.g. India, USA, Global' },
  { key: 'recent_investments', label: 'Recent Investments', type: 'textarea', placeholder: 'List of recent investments...' },
  { key: 'sectors', label: 'Sectors', type: 'text', placeholder: 'e.g. Fintech, SaaS, Healthcare' },
  { key: 'avg_startup_age', label: 'Avg Startup Age at Investment', type: 'text', placeholder: 'e.g. 2 years' },
  { key: 'avg_num_founders', label: 'Avg No. of Founders', type: 'text', placeholder: 'e.g. 2' },
  { key: 'avg_founder_age', label: 'Avg Founder Age', type: 'text', placeholder: 'e.g. 28' },
  { key: 'companies_invested', label: 'Companies Invested', type: 'textarea', placeholder: 'List of companies invested in...' },
];

const COMPANY_OFFER_FIELDS: FieldDef[] = [
  { key: 'discount_value', label: 'Discount Value', type: 'text', placeholder: 'e.g. 50% off, $500 credits' },
  { key: 'promo_code', label: 'Promo Code', type: 'text', placeholder: 'e.g. STARTUP50' },
  { key: 'valid_until', label: 'Valid Until', type: 'text', placeholder: 'e.g. 31 Dec 2026' },
  { key: 'terms', label: 'Terms & Conditions', type: 'textarea', placeholder: 'Any terms or conditions...' },
];

const TOOL_FIELDS: FieldDef[] = [
  {
    key: 'pricing_model',
    label: 'Pricing Model',
    type: 'select',
    placeholder: 'Select pricing model',
    options: [
      { value: '', label: 'Select...' },
      { value: 'free', label: 'Free' },
      { value: 'freemium', label: 'Freemium' },
      { value: 'paid', label: 'Paid' },
      { value: 'open_source', label: 'Open Source' },
      { value: 'free_trial', label: 'Free Trial' },
    ],
  },
  { key: 'platform', label: 'Platform', type: 'text', placeholder: 'e.g. Web, iOS, Android, Desktop' },
  { key: 'features', label: 'Key Features', type: 'textarea', placeholder: 'List key features...' },
];

const BANK_OFFER_FIELDS: FieldDef[] = [
  { key: 'interest_rate', label: 'Interest Rate', type: 'text', placeholder: 'e.g. 8.5% p.a.' },
  { key: 'loan_range', label: 'Loan Range', type: 'text', placeholder: 'e.g. ₹10L - ₹5Cr' },
  { key: 'repayment_period', label: 'Repayment Period', type: 'text', placeholder: 'e.g. 1-7 years' },
  { key: 'collateral_required', label: 'Collateral Required', type: 'select', placeholder: 'Select', options: [
    { value: '', label: 'Select...' },
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
    { value: 'partial', label: 'Partial' },
  ] },
];

export const CATEGORY_METADATA_FIELDS: Record<string, FieldDef[]> = {
  scheme: SCHEME_FIELDS,
  govt_scheme: SCHEME_FIELDS,
  accelerator_incubator: SCHEME_FIELDS,
  company_offer: COMPANY_OFFER_FIELDS,
  tool: TOOL_FIELDS,
  bank_offer: BANK_OFFER_FIELDS,
};
