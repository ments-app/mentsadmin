# Startup Profiles Extraction for `public.startup_profiles`

Source folder: `/Users/ayushmansingh/Downloads/all startup`

Processed PDFs: 19

Notes:
- `owner_id` has been set to `ec302a86-138b-491a-84b2-669383e2e35e`.
- `legal_status` is set to `pvt_ltd` only where the PDF explicitly mentioned `Pvt Ltd` or `Private Limited`. For the rest, it is set to `not_registered` as a conservative schema-safe fallback.
- `stage` is inferred from the poster content and kept conservative: `ideation` where the startup is still pre-prototype/pre-pilot, `mvp` where a prototype/pilot/beta already exists.
- Unknown fields are left `NULL`.
- `Gemicates event Poster_260312_123238.pdf` was image-based, so its content was extracted from an OCR-style preview.

## Normalized Startup Data

| Brand | Registered Name | Legal Status | Stage | Sector | Key traction / evidence |
|---|---|---|---|---|---|
| Aegis Drive | `NULL` | `not_registered` | `ideation` | Automotive safety / mobility | Research completed, retrofit architecture defined, vendor discussions ongoing, prototype prep underway |
| Bluegreen | `NULL` | `not_registered` | `mvp` | Foodtech / sustainable consumer products | 100+ customers, 200+ prototype users, sold out market stalls 3 times, patent filing in progress |
| Caterworld | `NULL` | `not_registered` | `mvp` | Catering marketplace / food services | Prototype completed, pilot engagements started, associations engaged, founder contact listed |
| ZiroEDA | `NULL` | `not_registered` | `mvp` | EDA / hardware developer tools | Initial framework built, first beta users onboarded, 375+ early beta users |
| Pravahan Engineering Pvt Ltd | `PRAVAHAN ENGINEERING PVT LTD` | `pvt_ltd` | `mvp` | Maritime autonomy / defense tech | Core team formed, architecture defined, prototypes under development, stakeholder engagement ongoing |
| Dozert.AI | `Dozert Tech Pvt Ltd` | `pvt_ltd` | `mvp` | EV fleet intelligence / charging tech | AI optimization model built, corridor pilot initiated, ULIP Hackathon 1st place, partner network formed |
| Ecogreen Innovations | `Ecogreen Innovations Pvt Ltd` | `pvt_ltd` | `mvp` | Sustainable materials / biodegradable products | INR 17 lakh support across grants/incubation, prototype-focused funding evidence |
| Enantio Healthcare | `NULL` | `not_registered` | `mvp` | Healthtech / medical simulation | Functional prototype in Aug 2025, second-gen prototype in Jan 2026, manufactured physical prototype complete |
| Gemicates | `Gemicates Technologies` | `not_registered` | `mvp` | Smart home / IoT | Pilot installs in 10+ homes, projects in Mauritius, expansion plans across India and globally |
| Krishaka | `NULL` | `not_registered` | `mvp` | Agritech / robotics | Robotic transplanting pilots with 5 farmers, modular chassis platform validated in field conditions |
| MachIntell | `MachIntell Solutions Pvt. Ltd.` | `pvt_ltd` | `mvp` | Industrial AI / reliability software | ReliabilityOS impact claims: 20-40% field failure reduction, 10-25% warranty cost reduction |
| Ofline | `NULL` | `not_registered` | `mvp` | Local commerce / retail tech | 250+ shop LOIs, 350+ additional shop interest, startup credits from AWS/Google/Microsoft |
| Drexon | `Drexon Industries` | `not_registered` | `mvp` | Defense tech / autonomous surveillance | BSF proof of concept, trials across active sites, first deployable unit in progress |
| IPIPL2025 | `INTERNATIONAL PHYTOMEDICINE INNOVATION PRIVATE LIMITED` | `pvt_ltd` | `ideation` | Biotech / infectious disease | Pandemic preparedness and antiviral thesis stated; no milestone data present in poster |
| Quiet Gesture | `NULL` | `not_registered` | `mvp` | Biomedical assistive communication | Prototype built, gesture detection pipeline developed, clinical outreach underway |
| SlateMate | `NULL` | `not_registered` | `mvp` | Child digital safety / AI wellbeing | Pilot with 14 families in Nov 2025, school outreach in Dec 2025, launch planned for Apr 2026 |
| SoApp | `NULL` | `not_registered` | `ideation` | Retail tech / store automation | Clear product concept and automation scope described; poster does not show pilot or traction numbers |
| Waterfly Technologies | `NULL` | `not_registered` | `mvp` | Maritime mobility / defense / logistics | 3m craft de-risked, 8m craft in development, Indian Navy co-development mentioned |
| ZinguaAI | `NULL` | `not_registered` | `mvp` | Real-time translation / communication AI | Low-latency architecture designed, streaming pipeline built, phone-call prototype under development |

## SQL Insert Batch

```sql
INSERT INTO public.startup_profiles (
  owner_id,
  brand_name,
  registered_name,
  legal_status,
  stage,
  description,
  keywords,
  startup_phone,
  business_model,
  categories,
  key_strengths,
  target_audience,
  elevator_pitch,
  traction_metrics,
  total_raised,
  sector
)
VALUES
(
  'ec302a86-138b-491a-84b2-669383e2e35e'::uuid,
  'Aegis Drive',
  NULL,
  'not_registered',
  'ideation',
  'Retrofit automotive safety startup adding ADAS, driver health monitoring, C-V2X connectivity, STARS systems, and federated learning to existing vehicles.',
  ARRAY['automotive safety', 'ADAS', 'vehicle retrofit', 'C-V2X', 'driver health monitoring'],
  NULL,
  'B2B/B2C automotive retrofit platform',
  ARRAY['mobility', 'automotive', 'safety tech', 'intelligent transport'],
  'Modular retrofit architecture, driver health monitoring, intelligent safety stack, connectivity-first design',
  'Owners of older vehicles, fleets, and automotive upgrade markets',
  'A retrofit intelligence layer that makes older vehicles safer and more connected without requiring new car purchases.',
  'Road safety research completed; modular retrofit architecture defined; founding team formed; vendor and component discussions ongoing; preparing prototype development and validation.',
  NULL,
  'Automotive safety / mobility'
),
(
  'ec302a86-138b-491a-84b2-669383e2e35e'::uuid,
  'Bluegreen',
  NULL,
  'not_registered',
  'mvp',
  'Consumer products startup focused on underutilised biological substances, currently developing MealIt as a meal substitute and Pappadamn as a low-sodium papad alternative.',
  ARRAY['foodtech', 'nutrition', 'consumer products', 'sustainable products', 'meal substitute'],
  NULL,
  'B2C consumer packaged goods',
  ARRAY['foodtech', 'nutrition', 'consumer goods', 'sustainability'],
  'Novel food formulations, positive customer validation, repeat market stall sales, patent filing in progress',
  'Health-conscious consumers and customers needing affordable meal alternatives',
  'Turning underused biological inputs into practical food products for healthier everyday consumption.',
  '100+ customers reached; product prototype tested with 200+ users; market testing across 3 Delhi NCR regions; 99% positive reviews; sold out in 3 market stalls; patent filing in progress.',
  NULL,
  'Foodtech / sustainable consumer products'
),
(
  'ec302a86-138b-491a-84b2-669383e2e35e'::uuid,
  'Caterworld',
  NULL,
  'not_registered',
  'mvp',
  'Enterprise-grade digital ecosystem for the fragmented catering industry, combining marketplace workflows, AI-powered menu creation, procurement planning, and blockchain-secured agreements.',
  ARRAY['catering', 'marketplace', 'food services', 'AI menus', 'blockchain contracts'],
  '+91 9962093632',
  'B2B/B2C marketplace and SaaS platform',
  ARRAY['food services', 'marketplace', 'procurement', 'enterprise software'],
  'Structured catering marketplace, AI menu personalization, procurement aggregation, blockchain-secured workflows',
  'Caterers, institutional clients, event organizers, and hospitality buyers',
  'Modernizing catering operations with a digital marketplace and workflow stack built for large-scale procurement and execution.',
  'Concept and market research completed; discussions with major catering associations and key players completed; prototype development finished; patent-applied AI and blockchain modules built; pilot engagements initiated.',
  NULL,
  'Catering marketplace / food services'
),
(
  'ec302a86-138b-491a-84b2-669383e2e35e'::uuid,
  'ZiroEDA',
  NULL,
  'not_registered',
  'mvp',
  'AI-powered virtual prototyping platform for building and verifying complete hardware systems before physical implementation.',
  ARRAY['EDA', 'hardware simulation', 'virtual prototyping', 'electronics', 'AI design tools'],
  NULL,
  'B2B SaaS developer tool',
  ARRAY['developer tools', 'electronics', 'hardware design', 'simulation'],
  'System-level verification, automated module integration, virtual prototyping workflow, early beta validation',
  'Hardware developers, electronics students, and hardware hobbyists',
  'An AI-based virtual prototyping environment that lets hardware teams verify system behavior before buying and integrating physical components.',
  'Core architecture defined; initial design framework built; first beta cohort onboarded; 375+ early beta users reported.',
  NULL,
  'EDA / hardware developer tools'
),
(
  'ec302a86-138b-491a-84b2-669383e2e35e'::uuid,
  'Pravahan Engineering',
  'PRAVAHAN ENGINEERING PVT LTD',
  'pvt_ltd',
  'mvp',
  'Autonomous maritime systems company building modular platforms for surface, underwater, and aerial operations across surveillance, inspection, monitoring, and logistics use cases.',
  ARRAY['maritime autonomy', 'defense tech', 'autonomous systems', 'underwater', 'surveillance'],
  NULL,
  'B2G/B2B autonomous platforms',
  ARRAY['defense tech', 'maritime', 'autonomy', 'robotics'],
  'Multi-domain autonomous platform design, modular architecture, mission adaptability, maritime safety focus',
  'Naval and coast guard agencies, maritime authorities, offshore operators, and research institutions',
  'Building modular autonomous maritime platforms that reduce cost and risk across surveillance, logistics, and inspection missions.',
  'Company and technical team formed; initial platform concepts and system architecture developed; prototype design underway; engaging maritime and defense stakeholders for validation.',
  NULL,
  'Maritime autonomy / defense tech'
),
(
  'ec302a86-138b-491a-84b2-669383e2e35e'::uuid,
  'Dozert.AI',
  'Dozert Tech Pvt Ltd',
  'pvt_ltd',
  'mvp',
  'Foundational AI platform for EV trip planning and smart charging decisions across personal EVs, fleets, and charging networks.',
  ARRAY['EV', 'smart charging', 'fleet intelligence', 'route optimization', 'telematics'],
  NULL,
  'B2B SaaS and platform for EV fleets and charging ecosystems',
  ARRAY['EV', 'fleet management', 'mobility', 'energy', 'AI'],
  'Realtime telematics integration, terrain and weather-aware optimization, tariff intelligence, charging wallet and API stack',
  'EV fleet operators, logistics companies, EV owners, charging infrastructure providers, and EV OEM partners',
  'AI for every EV mile, automating range-aware trip planning and charging decisions across fragmented EV ecosystems.',
  'Base AI optimization model developed; charging station database in development; road corridor pilot initiated; ULIP Hackathon 1st place; partnered with NHEV, NLDS, Plugzmart, Pickkup, and EV Blue; targeting 3500+ commercial EVs by 2030.',
  NULL,
  'EV fleet intelligence / charging tech'
),
(
  'ec302a86-138b-491a-84b2-669383e2e35e'::uuid,
  'Ecogreen Innovations',
  'Ecogreen Innovations Pvt Ltd',
  'pvt_ltd',
  'mvp',
  'Startup building ecofriendly products from biodegradable polymers with a low carbon footprint and renewable, non-toxic material focus.',
  ARRAY['biodegradable polymers', 'sustainable materials', 'eco products', 'green manufacturing'],
  NULL,
  'B2B/B2C sustainable materials and product business',
  ARRAY['sustainability', 'materials', 'biopolymers', 'eco products'],
  'Biodegradable polymer expertise, low-carbon positioning, non-toxic materials, grant-backed prototyping',
  'Eco-conscious consumers, packaging and product manufacturers, and sustainability-focused buyers',
  'Developing biodegradable polymer-based products that replace fossil-heavy alternatives with renewable and low-footprint materials.',
  'Prototyping backed by CZC 4.0 grant of INR 5 lakh; Nirmaan support of INR 7 lakh; OIE-IITM seed grant of INR 5 lakh.',
  'INR 17 lakh (grants and incubation support)',
  'Sustainable materials / biodegradable products'
),
(
  'ec302a86-138b-491a-84b2-669383e2e35e'::uuid,
  'Enantio Healthcare',
  NULL,
  'not_registered',
  'mvp',
  'Guided ultrasound training platform that replaces inconsistent clinical exposure with structured, repeatable simulation-based skill development.',
  ARRAY['healthtech', 'medical education', 'ultrasound', 'simulation', 'training platform'],
  NULL,
  'B2B institutional medical training platform',
  ARRAY['healthtech', 'medical education', 'simulation', 'training'],
  'Expert-aligned scan guidance, measurable competency scoring, modular design, scalable institutional deployment',
  'Medical colleges, nursing colleges, hospitals, and healthcare training centers',
  'A scalable simulation platform that helps clinicians learn ultrasound with repeatable practice and measurable skill development.',
  'First functional prototype built in Aug 2025; reviewed by Education Minister in Sep 2025; second-generation prototype built in Jan 2026; manufactured physical prototype completed; first Obstetrics clinical module completed.',
  NULL,
  'Healthtech / medical simulation'
),
(
  'ec302a86-138b-491a-84b2-669383e2e35e'::uuid,
  'Gemicates',
  'Gemicates Technologies',
  'not_registered',
  'mvp',
  'IoT-focused smart home automation startup whose flagship GEMESH product unifies monitoring and control of multiple home devices in a seamless local network.',
  ARRAY['IoT', 'smart home', 'home automation', 'GEMESH', 'energy efficiency'],
  NULL,
  'B2C subscription-based IoT platform',
  ARRAY['IoT', 'smart home', 'consumer electronics', 'automation'],
  'Unified local control, low-device fragmentation, scalable hub architecture, energy-saving environment management',
  'Modern households, smart home users, and facilities seeking accessible automation',
  'A unified smart-home control platform that simplifies fragmented device ecosystems through one hub and one app.',
  'Pilot installations in 10+ homes across Tamil Nadu; expansion roadmap to 5+ Indian states, 10000+ homes, and 30000+ users; IoT automation projects in Mauritius; upcoming MoU with technology partner in Kenya; impact claim of up to 15% energy savings.',
  NULL,
  'Smart home / IoT'
),
(
  'ec302a86-138b-491a-84b2-669383e2e35e'::uuid,
  'Krishaka',
  NULL,
  'not_registered',
  'mvp',
  'Agricultural robotics startup developing autonomous robots to automate labour-intensive farm operations such as paddy transplanting without requiring farmers to change traditional nursery methods.',
  ARRAY['agritech', 'robotics', 'paddy transplanting', 'farm automation', 'autonomous vehicles'],
  NULL,
  'Agritech hardware platform',
  ARRAY['agritech', 'robotics', 'farm automation'],
  'Autonomous navigation in wet fields, compatibility with traditional mat nurseries, modular common chassis, cost-effective design',
  'Small and medium farmers facing labour shortages and rising transplanting costs',
  'Autonomous farm robots that make paddy transplanting cheaper and more accessible without forcing changes to farmer workflows.',
  'Piloted robotic transplanting solution with 5 farmers across different locations; field feedback used to refine design and improve reliability.',
  NULL,
  'Agritech / robotics'
),
(
  'ec302a86-138b-491a-84b2-669383e2e35e'::uuid,
  'MachIntell',
  'MachIntell Solutions Pvt. Ltd.',
  'pvt_ltd',
  'mvp',
  'Industrial reliability startup offering an AI-integrated cyber-physical system and SaaS platform for production reliability improvement across manufacturing environments.',
  ARRAY['industrial AI', 'IIoT', 'reliability', 'manufacturing software', 'FMEA'],
  NULL,
  'B2B SaaS plus IIoT platform',
  ARRAY['industrial AI', 'manufacturing', 'SaaS', 'IIoT'],
  'Reliability orchestration, structured documentation, data integration, FMEA assistance, IIoT-enabled failure reporting',
  'Manufacturers, suppliers, assembly lines, and testing operations seeking reliability improvements',
  'A native reliability infrastructure for factories that combines IIoT data capture, structured documentation, and AI-assisted failure analysis.',
  'Impact metrics reported: 20-40% field failure reduction, 10-25% warranty cost reduction, and 60-70% reduction in corrective action time.',
  NULL,
  'Industrial AI / reliability software'
),
(
  'ec302a86-138b-491a-84b2-669383e2e35e'::uuid,
  'Ofline',
  NULL,
  'not_registered',
  'mvp',
  'Marketplace app for local shops that improves discoverability, ordering, and pickup while helping merchants manage orders digitally.',
  ARRAY['local commerce', 'marketplace', 'retail tech', 'pre-order', 'shop discovery'],
  NULL,
  'B2B2C marketplace',
  ARRAY['retail tech', 'local commerce', 'marketplace'],
  'Shop discovery, instant pickup workflow, merchant visibility, lightweight order management',
  'Local shops, neighborhood customers, and campus users',
  'A digital marketplace for offline shops that lets customers discover stores, pre-order products, and skip waiting.',
  'Incubated at Nirmaan and IITM Incubation Cell; signed LOIs with 250+ shops; interest received from 350+ additional shops; startup credits received from AWS, Google for Startups, and Microsoft for Startups.',
  NULL,
  'Local commerce / retail tech'
),
(
  'ec302a86-138b-491a-84b2-669383e2e35e'::uuid,
  'Drexon',
  'Drexon Industries',
  'not_registered',
  'mvp',
  'Defense technology startup building autonomous AI surveillance towers for perimeter and border security under the Vanguard T-1 product line.',
  ARRAY['defense tech', 'autonomous surveillance', 'border security', 'radar', 'thermal imaging'],
  NULL,
  'B2G defense technology platform',
  ARRAY['defense tech', 'autonomy', 'surveillance', 'security infrastructure'],
  'Self-contained edge AI, multi-spectrum radar and EO/IR sensors, encrypted mesh networking, fast deployment',
  'Border Security Force, military, coast guard, navy, dockyards, and critical infrastructure operators',
  'Autonomous surveillance towers that detect, classify, and coordinate border threats without requiring continuous human monitoring.',
  'Threat detection up to 12 km; classification in under 80 ms; one operator can monitor 30 towers covering up to 360 km; confirmed BSF proof of concept and trial permissions across active sites; estimated savings of over INR 18 crore per year versus equivalent manned patrols.',
  NULL,
  'Defense tech / autonomous surveillance'
),
(
  'ec302a86-138b-491a-84b2-669383e2e35e'::uuid,
  'IPIPL2025',
  'INTERNATIONAL PHYTOMEDICINE INNOVATION PRIVATE LIMITED',
  'pvt_ltd',
  'ideation',
  'Biotech startup focused on pandemic preparedness, pan-antiviral and universal antiviral approaches spanning human, plant, and animal infectious diseases, including drug resistance challenges.',
  ARRAY['biotech', 'antiviral', 'infectious disease', 'pandemic preparedness', 'phytomedicine'],
  NULL,
  'Biotech R&D venture',
  ARRAY['biotech', 'healthcare', 'infectious disease', 'life sciences'],
  'Broad infectious disease thesis, pandemic preparedness framing, pan-antiviral ambition',
  'Public health stakeholders, pharma partners, agriculture health stakeholders, and animal health systems',
  'Preparing for future pandemics with broad-spectrum antiviral and resistance-focused biotech innovation.',
  'Poster states infectious disease focus and universal antiviral positioning, but does not provide milestone or user traction details.',
  NULL,
  'Biotech / infectious disease'
),
(
  'ec302a86-138b-491a-84b2-669383e2e35e'::uuid,
  'Quiet Gesture',
  NULL,
  'not_registered',
  'mvp',
  'Biomedical assistive communication system for conscious but non-verbal patients, using wearable bio-impedance sensing and AI-interpreted gestures.',
  ARRAY['assistive tech', 'biomedical', 'ICU', 'bio-impedance', 'patient communication'],
  NULL,
  'B2B hospital and assistive technology product',
  ARRAY['healthtech', 'assistive tech', 'biomedical devices'],
  'Wearable signal sensing, AI-based gesture interpretation, minimal-movement support, real-time caregiver interface',
  'ICU patients, stroke survivors, ALS patients, paralysis patients, caregivers, and hospitals',
  'A wearable communication bridge for conscious patients who cannot speak, built to restore autonomy and reduce clinical uncertainty.',
  'Problem validation completed through clinical observations and literature; initial sensing prototype developed; signal processing pipeline built; clinician and hospital outreach in progress; controlled prototype testing completed; preparing clinical trials and regulatory pathway.',
  NULL,
  'Biomedical assistive communication'
),
(
  'ec302a86-138b-491a-84b2-669383e2e35e'::uuid,
  'SlateMate',
  NULL,
  'not_registered',
  'mvp',
  'SlateMate is building eRaksha, an AI-powered digital guardian that protects children aged 10-16 from harmful content, cyberbullying, and digital stress.',
  ARRAY['child safety', 'digital wellbeing', 'AI companion', 'parental controls', 'cyberbullying'],
  NULL,
  'B2C/B2B2C digital safety platform',
  ARRAY['child safety', 'AI', 'consumer app', 'digital wellbeing'],
  'DNS-level shielding, smart redirection, emotional AI companion, parent insight dashboard',
  'Parents, children aged 10-16, and schools concerned with digital safety',
  'An AI-driven digital guardian that helps families build safer online habits instead of relying on blunt content blocking alone.',
  'Research and concept development completed in Jun 2025; prototype completed in Oct 2025; pilot tested with 14 families in Nov 2025; school outreach and validation in Dec 2025; official product launch planned for Apr 2026.',
  NULL,
  'Child digital safety / AI wellbeing'
),
(
  'ec302a86-138b-491a-84b2-669383e2e35e'::uuid,
  'SoApp',
  NULL,
  'not_registered',
  'ideation',
  'Retail automation platform that lets shoppers use a smartphone for product discovery, carting, payment, and in-store navigation while helping retailers automate inventory and checkout workflows.',
  ARRAY['retail automation', 'mobile checkout', 'inventory management', 'anti-shoplifting', 'store mapping'],
  NULL,
  'B2B retail software platform',
  ARRAY['retail tech', 'automation', 'mobile commerce'],
  'Smartphone-led checkout, inventory tracking, receipt verification, shoplifting prevention, in-store product maps',
  'Retailers and in-store shoppers seeking faster, digital-first shopping experiences',
  'A smartphone-native operating layer for physical retail that removes checkout friction and improves store operations.',
  'Poster clearly describes product scope across inventory, checkout, receipt verification, security, and product mapping, but does not mention pilots or quantified traction.',
  NULL,
  'Retail tech / store automation'
),
(
  'ec302a86-138b-491a-84b2-669383e2e35e'::uuid,
  'Waterfly Technologies',
  NULL,
  'not_registered',
  'mvp',
  'Transportation startup building wing-in-ground crafts for high-speed movement of people and cargo above water using ground effect.',
  ARRAY['wing-in-ground', 'transportation', 'maritime mobility', 'cargo', 'defense'],
  NULL,
  'B2B/B2G transportation technology',
  ARRAY['mobility', 'logistics', 'maritime', 'defense tech'],
  'Ground-effect craft design, in-house controls and manufacturing, dual passenger/cargo use cases, naval collaboration',
  'Coastal passengers, cargo operators, defense users, and disaster relief systems',
  'Building water-based high-speed craft that are cheaper than flights and faster than boats for coastal and logistics use cases.',
  'Technology de-risked with a 3 m wingspan craft; 8 m craft under development and testing; stealth naval WIG solution co-developed with Indian Navy; Centre of Excellence for WIG technology being established.',
  NULL,
  'Maritime mobility / defense / logistics'
),
(
  'ec302a86-138b-491a-84b2-669383e2e35e'::uuid,
  'ZinguaAI',
  NULL,
  'not_registered',
  'mvp',
  'Real-time voice translation platform that enables people speaking different languages to communicate naturally during live calls.',
  ARRAY['voice translation', 'real-time translation', 'communication AI', 'speech synthesis', 'multilingual'],
  NULL,
  'B2B/B2C SaaS communication platform',
  ARRAY['AI', 'communication', 'translation', 'SaaS'],
  'Sub-300 ms latency target, speech recognition plus translation plus voice synthesis pipeline, live-call streaming architecture',
  'Global remote teams, freelancers, customer support teams, educators, students, travelers, and multicultural communities',
  'A low-latency voice translation layer that makes cross-language live calls feel like native conversations.',
  'Low-latency architecture designed; speech recognition, translation, and voice synthesis models integrated; live streaming pipeline built; phone-call prototype under development; MVP launch and real-world testing are next steps.',
  NULL,
  'Real-time translation / communication AI'
);
```

## Review Items Before Running

- Verify whether any `not_registered` startups are actually incorporated. That field is required by your schema, so I used the safest fallback where the poster did not explicitly state legal status.
- `owner_id` is already filled with your Supabase user UUID.
- If you want, the next step can be a second pass over the image files in the same folder (`.png`, `.jpg`) so those startups are also converted into SQL rows.
