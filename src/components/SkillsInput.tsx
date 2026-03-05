'use client';

import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

const ALL_SKILLS = [
  // ── Programming Languages ──────────────────────────────────────
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C', 'C++', 'C#', 'Go', 'Rust', 'PHP',
  'Ruby', 'Swift', 'Kotlin', 'Dart', 'Scala', 'R', 'MATLAB', 'Perl', 'Haskell', 'Elixir',
  'Lua', 'Julia', 'Groovy', 'Bash/Shell', 'PowerShell', 'Assembly', 'COBOL', 'Fortran',

  // ── Frontend ──────────────────────────────────────────────────
  'React', 'Next.js', 'Vue.js', 'Nuxt.js', 'Angular', 'Svelte', 'SvelteKit', 'Solid.js',
  'Astro', 'HTML', 'CSS', 'Tailwind CSS', 'SASS/SCSS', 'Bootstrap', 'Material UI',
  'Chakra UI', 'shadcn/ui', 'Ant Design', 'Redux', 'Zustand', 'Recoil', 'Jotai',
  'React Query', 'SWR', 'GraphQL', 'REST APIs', 'WebSockets', 'WebRTC', 'Three.js',
  'D3.js', 'Chart.js', 'Framer Motion', 'GSAP',

  // ── Backend ───────────────────────────────────────────────────
  'Node.js', 'Express.js', 'NestJS', 'Fastify', 'Hapi.js', 'Django', 'FastAPI', 'Flask',
  'Spring Boot', 'Spring Framework', 'Laravel', 'Symfony', 'Ruby on Rails', 'ASP.NET',
  '.NET Core', 'Gin', 'Echo', 'Fiber', 'Actix', 'Axum', 'Phoenix (Elixir)',
  'gRPC', 'GraphQL API', 'REST API Design', 'Microservices', 'Event-Driven Architecture',

  // ── Mobile Development ────────────────────────────────────────
  'React Native', 'Flutter', 'iOS Development', 'Android Development', 'SwiftUI',
  'Jetpack Compose', 'Kotlin Multiplatform', 'Ionic', 'Capacitor', 'Expo',
  'Xamarin', 'Cordova', 'Mobile UI/UX', 'App Store Optimization',

  // ── Database ──────────────────────────────────────────────────
  'PostgreSQL', 'MySQL', 'MariaDB', 'SQLite', 'Microsoft SQL Server', 'Oracle DB',
  'MongoDB', 'CouchDB', 'Cassandra', 'DynamoDB', 'Redis', 'Memcached',
  'Elasticsearch', 'OpenSearch', 'Neo4j', 'InfluxDB', 'TimescaleDB',
  'Supabase', 'Firebase', 'PlanetScale', 'Neon', 'Prisma', 'Drizzle ORM',
  'TypeORM', 'Mongoose', 'SQLAlchemy', 'Hibernate',

  // ── Cloud & DevOps ────────────────────────────────────────────
  'AWS', 'Google Cloud Platform', 'Microsoft Azure', 'DigitalOcean', 'Cloudflare',
  'Vercel', 'Netlify', 'Railway', 'Render', 'Heroku', 'Fly.io',
  'Docker', 'Kubernetes', 'Helm', 'Terraform', 'Ansible', 'Pulumi',
  'CI/CD', 'GitHub Actions', 'GitLab CI', 'Jenkins', 'CircleCI', 'ArgoCD',
  'Linux', 'Nginx', 'Apache', 'Caddy', 'Serverless', 'AWS Lambda',
  'Monitoring & Observability', 'Prometheus', 'Grafana', 'Datadog', 'New Relic',

  // ── Testing & QA ──────────────────────────────────────────────
  'Unit Testing', 'Integration Testing', 'E2E Testing', 'Manual Testing',
  'Jest', 'Vitest', 'Cypress', 'Playwright', 'Selenium', 'Puppeteer',
  'JUnit', 'PyTest', 'RSpec', 'Mocha', 'Chai', 'Testing Library',
  'Load Testing', 'Performance Testing', 'k6', 'JMeter', 'Postman',
  'Test Automation', 'QA Engineering', 'Bug Tracking', 'JIRA QA',

  // ── Cybersecurity ─────────────────────────────────────────────
  'Cybersecurity', 'Ethical Hacking', 'Penetration Testing', 'VAPT',
  'Network Security', 'Application Security', 'Cloud Security',
  'SIEM', 'SOC', 'Threat Intelligence', 'Vulnerability Assessment',
  'OWASP', 'Cryptography', 'Identity & Access Management', 'Zero Trust',
  'Compliance (ISO 27001)', 'GDPR Compliance', 'SOC 2', 'NIST Framework',

  // ── AI / ML / Data Science ────────────────────────────────────
  'Machine Learning', 'Deep Learning', 'Supervised Learning', 'Unsupervised Learning',
  'Reinforcement Learning', 'TensorFlow', 'PyTorch', 'Keras', 'Scikit-learn',
  'Hugging Face', 'LangChain', 'LlamaIndex', 'OpenAI API', 'Anthropic API',
  'NLP', 'Computer Vision', 'LLMs', 'Prompt Engineering', 'RAG',
  'Data Science', 'Data Analysis', 'Data Engineering', 'Feature Engineering',
  'MLOps', 'Model Deployment', 'Apache Spark', 'Hadoop', 'Kafka',
  'Pandas', 'NumPy', 'Matplotlib', 'Seaborn', 'Plotly', 'SciPy',
  'Statistics', 'A/B Testing', 'Bayesian Analysis', 'Time Series Analysis',

  // ── Data & Analytics Tools ────────────────────────────────────
  'Power BI', 'Tableau', 'Looker', 'Google Data Studio', 'Metabase',
  'Google Analytics', 'Mixpanel', 'Amplitude', 'Hotjar', 'Segment',
  'SQL', 'BigQuery', 'Redshift', 'Snowflake', 'dbt', 'Airflow',
  'Excel', 'Google Sheets', 'Advanced Excel', 'VBA',

  // ── Web3 / Blockchain ─────────────────────────────────────────
  'Solidity', 'Rust (Solana)', 'Web3.js', 'Ethers.js', 'Hardhat', 'Foundry',
  'Smart Contracts', 'Blockchain', 'DeFi', 'NFTs', 'DAOs', 'Tokenomics',
  'IPFS', 'The Graph', 'Chainlink', 'Ethereum', 'Polygon', 'Solana',

  // ── Embedded / Hardware / IoT ────────────────────────────────
  'Embedded Systems', 'C (Embedded)', 'RTOS', 'Arduino', 'Raspberry Pi',
  'ESP32', 'STM32', 'FPGA', 'PCB Design', 'KiCad', 'Altium Designer',
  'IoT', 'MQTT', 'Zigbee', 'LoRaWAN', 'BLE', 'CAN Bus', 'Modbus',
  'Signal Processing', 'VHDL', 'Verilog',

  // ── Game Development ─────────────────────────────────────────
  'Unity', 'Unreal Engine', 'Godot', 'Game Design', 'Game Development',
  'C# (Unity)', 'C++ (Unreal)', 'Shader Development', 'AR/VR Development',
  'Mobile Gaming', 'Level Design', 'Game Monetization',

  // ── Design ───────────────────────────────────────────────────
  'Figma', 'Adobe XD', 'Sketch', 'InVision', 'Zeplin', 'Framer',
  'UI/UX Design', 'Product Design', 'Interaction Design', 'Visual Design',
  'Graphic Design', 'Motion Design', 'Brand Design', 'Typography',
  'Color Theory', 'Wireframing', 'Prototyping', 'User Research',
  'Usability Testing', 'Design Systems', 'Accessibility (a11y)',
  'Adobe Photoshop', 'Adobe Illustrator', 'Adobe InDesign', 'Adobe After Effects',
  'Adobe Premiere Pro', 'Adobe Lightroom', 'Canva', 'Webflow',
  'Illustration', '3D Design', 'Blender', 'Cinema 4D', 'Rhino 3D',

  // ── Product & Project Management ──────────────────────────────
  'Product Management', 'Product Strategy', 'Roadmapping', 'OKRs',
  'Project Management', 'Agile', 'Scrum', 'Kanban', 'Lean', 'SAFe',
  'JIRA', 'Confluence', 'Notion', 'Asana', 'Trello', 'Linear',
  'Stakeholder Management', 'User Story Mapping', 'Sprint Planning',
  'Business Analysis', 'Requirements Gathering', 'Process Improvement',
  'Change Management', 'Risk Management', 'Program Management',

  // ── Marketing ─────────────────────────────────────────────────
  'Digital Marketing', 'Performance Marketing', 'Growth Hacking',
  'SEO', 'Technical SEO', 'On-page SEO', 'Link Building',
  'SEM', 'Google Ads', 'Meta Ads', 'LinkedIn Ads', 'Twitter Ads',
  'Social Media Marketing', 'Instagram Marketing', 'YouTube Marketing',
  'Content Marketing', 'Content Strategy', 'Blogging', 'Podcasting',
  'Email Marketing', 'Marketing Automation', 'HubSpot', 'Mailchimp',
  'Influencer Marketing', 'Affiliate Marketing', 'Brand Strategy',
  'Public Relations', 'Press Releases', 'Media Relations',
  'Community Management', 'GTM Strategy', 'Product Marketing',
  'Market Research', 'Competitive Analysis', 'Customer Segmentation',

  // ── Sales & Business Development ─────────────────────────────
  'Sales', 'B2B Sales', 'B2C Sales', 'SaaS Sales', 'Enterprise Sales',
  'Business Development', 'Lead Generation', 'Cold Outreach', 'SDR',
  'Account Management', 'Key Account Management', 'Customer Success',
  'CRM', 'HubSpot CRM', 'Salesforce', 'Pipedrive', 'ZoomInfo',
  'Negotiation', 'Contract Negotiation', 'Proposal Writing',
  'Partnership Development', 'Channel Sales', 'Inside Sales',

  // ── Finance & Accounting ──────────────────────────────────────
  'Financial Modeling', 'Financial Analysis', 'Valuation', 'DCF Analysis',
  'Accounting', 'Bookkeeping', 'GST', 'Tally', 'QuickBooks', 'Zoho Books',
  'Fundraising', 'Venture Capital', 'Private Equity', 'Due Diligence',
  'Pitch Decks', 'Investor Relations', 'Cap Table Management',
  'FP&A', 'Budgeting', 'Cash Flow Management', 'Treasury',
  'Taxation', 'Audit', 'Compliance', 'IFRS', 'GAAP',
  'Banking', 'Insurance', 'Risk Assessment', 'Portfolio Management',

  // ── HR & People Operations ────────────────────────────────────
  'Recruitment', 'Talent Acquisition', 'Sourcing', 'HR Management',
  'HR Business Partner', 'Employee Relations', 'Performance Management',
  'Compensation & Benefits', 'Payroll', 'HRMS', 'Workday', 'Darwinbox',
  'Learning & Development', 'Organizational Development', 'DEI',
  'Culture Building', 'Employee Engagement', 'Onboarding',

  // ── Operations & Supply Chain ─────────────────────────────────
  'Operations Management', 'Supply Chain Management', 'Procurement',
  'Logistics', 'Inventory Management', 'Warehouse Management',
  'Last-Mile Delivery', 'Fleet Management', 'Vendor Management',
  'Quality Control', 'Six Sigma', 'Lean Manufacturing', 'Kaizen',
  'ERP Systems', 'SAP', 'Oracle ERP', 'NetSuite',

  // ── Customer Support ─────────────────────────────────────────
  'Customer Support', 'Customer Service', 'Technical Support',
  'Zendesk', 'Freshdesk', 'Intercom', 'Help Scout', 'Chatbot Management',
  'Customer Experience (CX)', 'SLA Management', 'Escalation Handling',

  // ── Legal ─────────────────────────────────────────────────────
  'Corporate Law', 'Contract Drafting', 'Contract Review', 'Legal Research',
  'Intellectual Property', 'Trademark', 'Patents', 'Copyright',
  'Startup Law', 'Regulatory Compliance', 'Data Privacy Law', 'GDPR',
  'Employment Law', 'Commercial Law', 'Mergers & Acquisitions',

  // ── Healthcare & Biotech ──────────────────────────────────────
  'Healthcare Management', 'Clinical Research', 'Medical Writing',
  'Regulatory Affairs', 'FDA Compliance', 'Clinical Trials', 'GCP',
  'Bioinformatics', 'Genomics', 'Drug Discovery', 'Medical Devices',
  'Health Informatics', 'EMR/EHR Systems', 'Telemedicine', 'HealthTech',

  // ── Education & EdTech ────────────────────────────────────────
  'Curriculum Design', 'Instructional Design', 'E-learning',
  'LMS Administration', 'Training & Development', 'Corporate Training',
  'Academic Writing', 'Educational Technology', 'SCORM', 'Moodle',

  // ── Media & Content Production ────────────────────────────────
  'Video Production', 'Video Editing', 'DaVinci Resolve', 'Final Cut Pro',
  'Photography', 'Photo Editing', 'Drone Photography', 'Cinematography',
  'Podcast Production', 'Audio Editing', 'Audacity', 'Adobe Audition',
  'YouTube Channel Management', 'OTT Content', 'Animation', 'Storyboarding',

  // ── Communication & Soft Skills ──────────────────────────────
  'Technical Writing', 'Copywriting', 'Content Writing', 'Grant Writing',
  'Public Speaking', 'Presentation Skills', 'Communication',
  'Leadership', 'Team Management', 'Mentoring', 'Coaching',
  'Critical Thinking', 'Problem Solving', 'Decision Making',
  'Conflict Resolution', 'Cross-functional Collaboration',
  'Remote Team Management', 'Time Management',

  // ── Architecture & Real Estate ────────────────────────────────
  'Architecture', 'AutoCAD', 'Revit', 'SketchUp', 'BIM',
  'Interior Design', 'Urban Planning', 'Real Estate', 'Property Management',
  'Construction Management', 'Civil Engineering', 'Structural Engineering',

  // ── E-commerce ───────────────────────────────────────────────
  'E-commerce Management', 'Shopify', 'WooCommerce', 'Magento',
  'Amazon Seller', 'Flipkart Seller', 'D2C Strategy', 'Marketplace Management',
  'Conversion Rate Optimization', 'Category Management',
].sort();

type Props = {
  value: string[];
  onChange: (skills: string[]) => void;
};

export default function SkillsInput({ value, onChange }: Props) {
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filtered = input.trim()
    ? ALL_SKILLS.filter(
        (s) =>
          s.toLowerCase().includes(input.toLowerCase()) &&
          !value.includes(s)
      ).slice(0, 8)
    : [];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function add(skill: string) {
    const s = skill.trim();
    if (s && !value.includes(s)) {
      onChange([...value, s]);
    }
    setInput('');
    setOpen(false);
  }

  function remove(skill: string) {
    onChange(value.filter((s) => s !== skill));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (filtered.length > 0) {
        add(filtered[0]);
      } else if (input.trim()) {
        add(input.trim());
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Selected skills */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
            >
              {skill}
              <button type="button" onClick={() => remove(skill)} className="ml-0.5 hover:text-purple-900 dark:hover:text-purple-100">
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input with dropdown */}
      <div ref={wrapperRef} className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => { setInput(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search skills or type a custom one and press Enter"
          className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-muted"
        />

        {open && filtered.length > 0 && (
          <ul className="absolute z-50 mt-1 w-full rounded-lg border border-card-border bg-background shadow-lg overflow-hidden">
            {filtered.map((skill) => (
              <li key={skill}>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); add(skill); }}
                  className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  {skill}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
