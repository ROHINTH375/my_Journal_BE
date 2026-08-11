// Seeds the demo content that used to live in my_Journal_FE/src/data/*.ts —
// keeps the live site non-empty after the frontend switches to fetching from
// this API. Idempotent (upserts by slug), safe to re-run.
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Issue = require('./models/Issue');
const Article = require('./models/Article');

dotenv.config();

const issues = [
  { slug: 'v3-i2-2026', volume: 3, number: 2, year: 2026, season: 'Summer', label: 'Vol. 3, No. 2 (2026)', isCurrent: true },
  { slug: 'v3-i1-2026', volume: 3, number: 1, year: 2026, season: 'Winter', label: 'Vol. 3, No. 1 (2026)', isCurrent: false },
  { slug: 'v2-i2-2025', volume: 2, number: 2, year: 2025, season: 'Summer', label: 'Vol. 2, No. 2 (2025)', isCurrent: false }
];

const articles = [
  {
    slug: 'computational-metaphor-climate-narratives',
    title: 'Computational Metaphor: How Climate Narratives Shape Public Risk Perception',
    authors: [
      { name: 'Marisol Otieno-Reyes', affiliation: 'Department of Environmental Communication, Cedar Bluff University', country: 'Kenya' },
      { name: 'Declan Fitzgerald', affiliation: 'School of Public Policy, Northmoor Institute', country: 'Ireland' }
    ],
    abstractExcerpt: "A computational analysis of over forty thousand climate-related news items finds that metaphor choice — flood, fever, or countdown — measurably shifts readers' sense of urgency and personal control.",
    abstract: "This study applies large-scale computational text analysis to examine how recurring metaphors in climate journalism shape public perception of risk. Drawing on a corpus of more than forty thousand articles published across twelve countries between 2018 and 2025, we classify dominant metaphor families (e.g., flood, fever, countdown, war) and pair this classification with a cross-national survey experiment (n = 3,412) measuring perceived urgency, personal agency, and policy support. We find that 'countdown' framings increase perceived urgency but depress a sense of personal agency, while 'fever' framings do the reverse. Effects are moderated by prior political orientation but persist across all measured demographics. We argue that climate communicators face a genuine trade-off between urgency and agency in metaphor selection, and we propose a framework for choosing metaphors deliberately rather than by convention.",
    keywords: ['climate communication', 'computational linguistics', 'risk perception', 'public policy'],
    doi: '10.5555/lattice.2026.0301',
    issueSlug: 'v3-i2-2026',
    articleNumber: 1,
    pages: '1–24',
    publishedDate: '2026-06-15'
  },
  {
    slug: 'gut-microbiome-cognitive-aging',
    title: 'Gut Microbiome Diversity and Cognitive Aging: A Cross-Cultural Longitudinal Study',
    authors: [
      { name: 'Priya Chandrasekaran', affiliation: 'Institute of Neuroscience, Alaknanda University', country: 'India' },
      { name: 'Tomas Lindqvist', affiliation: 'Department of Gerontology, Fjordholm University', country: 'Sweden' },
      { name: 'Amara Nwosu', affiliation: 'Faculty of Medicine, Obuasi Health Sciences Center', country: 'Nigeria' }
    ],
    abstractExcerpt: 'An eight-year study across three countries links gut microbiome diversity in midlife to the rate of later cognitive decline, independent of diet and known genetic risk factors.',
    abstract: 'Emerging evidence links gut microbiome composition to neurological outcomes, but longitudinal, cross-cultural data remain scarce. We followed 1,204 adults aged 45–60 across three cohorts (Chennai, Umeå, and Enugu) for eight years, collecting annual stool microbiome samples alongside standardized cognitive batteries. Higher baseline microbiome alpha-diversity predicted significantly slower decline on measures of working memory and processing speed, an association that held after adjusting for diet, education, and APOE genotype. Mediation analysis suggests the relationship is partially explained by circulating markers of systemic inflammation. These findings support the gut-brain axis as a modifiable target for cognitive aging research and argue for microbiome diversity as a candidate biomarker in future intervention trials.',
    keywords: ['microbiome', 'cognitive aging', 'longitudinal study', 'neuroscience'],
    doi: '10.5555/lattice.2026.0302',
    issueSlug: 'v3-i2-2026',
    articleNumber: 2,
    pages: '25–58',
    publishedDate: '2026-06-15'
  },
  {
    slug: 'algorithmic-governance-labor-markets',
    title: 'Algorithmic Governance and the Reshaping of Informal Labor Markets',
    authors: [
      { name: 'Renata Souza Lima', affiliation: 'Center for Labor Studies, Serra Alta University', country: 'Brazil' }
    ],
    abstractExcerpt: 'Ethnographic fieldwork with gig-platform workers in three Brazilian cities shows algorithmic dispatch systems importing the discipline of formal employment without its protections.',
    abstract: "Platform work is often described as an extension of the informal economy, but this paper argues that algorithmic dispatch and rating systems introduce a distinct governance regime — one that imports the behavioral discipline of formal employment while withholding its legal protections. Based on eighteen months of ethnographic fieldwork with delivery and ride-hail workers in Recife, Salvador, and Belo Horizonte, I trace how workers internalize algorithmic performance targets as binding obligations despite having no contractual employment relationship. I term this 'informalized formality' and argue it complicates existing labor law frameworks, which assume a binary between formal and informal work. The paper closes with policy implications for platform regulation currently under debate in the Brazilian congress.",
    keywords: ['algorithmic governance', 'labor economics', 'informal economy', 'platform work'],
    doi: '10.5555/lattice.2026.0201',
    issueSlug: 'v3-i1-2026',
    articleNumber: 1,
    pages: '1–19',
    publishedDate: '2026-01-20'
  },
  {
    slug: 'medieval-textile-trade-networks',
    title: 'Reconstructing Medieval Textile Trade Networks Through Isotope Analysis',
    authors: [
      { name: 'Helene Marchetti', affiliation: "Department of Archaeology, Val d'Orno University", country: 'Italy' },
      { name: 'Wen Jia Sun', affiliation: 'Institute for Historical Sciences, Baiyun Academy', country: 'Singapore' }
    ],
    abstractExcerpt: 'Strontium and sulfur isotope signatures in wool fragments from four archaeological sites trace a previously undocumented overland trade route connecting inland textile workshops to coastal ports.',
    abstract: 'Documentary evidence for medieval textile trade is fragmentary, particularly for overland routes connecting inland production centers to coastal markets. This study applies strontium and sulfur isotope analysis to 86 wool textile fragments recovered from four archaeological sites dated to the 12th–14th centuries. Isotope signatures cluster into three distinct provenance groups inconsistent with previously assumed trade patterns, suggesting a substantial and previously undocumented overland route linking inland workshop clusters to a coastal port complex. We cross-reference these findings against surviving customs records and propose a revised map of regional textile trade infrastructure. The method demonstrated here offers a template for provenance work in regions where documentary records are sparse or lost.',
    keywords: ['archaeology', 'isotope analysis', 'trade history', 'medieval studies'],
    doi: '10.5555/lattice.2026.0202',
    issueSlug: 'v3-i1-2026',
    articleNumber: 2,
    pages: '20–47',
    publishedDate: '2026-01-20'
  },
  {
    slug: 'quantum-noise-social-simulation',
    title: 'Quantum Noise as a Generative Constraint in Agent-Based Social Simulation',
    authors: [
      { name: 'Oskar Bergmann', affiliation: 'Complexity Science Lab, Nordkapp Institute of Technology', country: 'Norway' },
      { name: 'Fatima Al-Rashidi', affiliation: 'Department of Applied Mathematics, Dilmun University', country: 'Bahrain' }
    ],
    abstractExcerpt: 'Replacing pseudo-random noise with sampled quantum noise in agent-based models produces measurably different — and in some cases more realistic — patterns of social clustering.',
    abstract: "Agent-based models of social behavior typically rely on pseudo-random number generators to introduce stochasticity, an implementation detail rarely scrutinized for its downstream effects. We compare simulation outcomes when noise is drawn from a standard pseudo-random source versus sampled from a quantum random number generator, across three canonical social simulation models (opinion dynamics, residential segregation, and epidemic spread). Quantum-sourced noise produces measurably different clustering coefficients and phase-transition thresholds in two of the three models, with segregation dynamics showing the largest divergence. We do not claim quantum noise is more 'correct,' but argue that noise source is an underexamined modeling choice with real consequences for simulated outcomes, and we recommend it be reported as a standard methodological detail.",
    keywords: ['quantum computing', 'agent-based modeling', 'complexity science', 'social simulation'],
    doi: '10.5555/lattice.2025.0202',
    issueSlug: 'v2-i2-2025',
    articleNumber: 2,
    pages: '33–61',
    publishedDate: '2025-07-08'
  },
  {
    slug: 'coral-reef-soundscapes-restoration',
    title: 'Acoustic Enrichment and Larval Recruitment in Coral Reef Restoration',
    authors: [
      { name: 'Junko Hasegawa', affiliation: 'Marine Biology Program, Kuroshio Research Center', country: 'Japan' },
      { name: 'Malia Fonoti', affiliation: 'School of Ocean Sciences, Vasa Pacific University', country: 'Samoa' }
    ],
    abstractExcerpt: 'Playing recordings of healthy reef soundscapes over degraded reef sites nearly doubles coral larval settlement rates compared to silent control sites over a two-year field trial.',
    abstract: 'Degraded coral reefs are acoustically as well as biologically impoverished, and larvae of many reef species use sound as a settlement cue. Over a two-year field trial at six degraded reef sites in the western Pacific, we deployed underwater speakers broadcasting recordings of healthy reef soundscapes at three sites, leaving three matched sites as silent controls. Acoustically enriched sites showed a 1.8-fold increase in coral larval settlement and higher juvenile survival at eighteen months. Fish community diversity also increased at enriched sites, consistent with a broader ecological recovery signal. These results position acoustic enrichment as a low-cost, scalable complement to existing coral restoration techniques, particularly at sites where physical outplanting is impractical.',
    keywords: ['marine biology', 'coral restoration', 'bioacoustics', 'conservation'],
    doi: '10.5555/lattice.2025.0201',
    issueSlug: 'v2-i2-2025',
    articleNumber: 1,
    pages: '1–32',
    publishedDate: '2025-07-08'
  }
];

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB Connected');

  const issueIdBySlug = {};
  for (const issue of issues) {
    const saved = await Issue.findOneAndUpdate({ slug: issue.slug }, issue, { upsert: true, new: true });
    issueIdBySlug[issue.slug] = saved._id;
    console.log(`Issue: ${saved.label}`);
  }

  for (const { issueSlug, ...article } of articles) {
    await Article.findOneAndUpdate(
      { slug: article.slug },
      { ...article, issue: issueIdBySlug[issueSlug] },
      { upsert: true, new: true }
    );
    console.log(`Article: ${article.title}`);
  }

  console.log('Seed complete.');
  process.exit(0);
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
