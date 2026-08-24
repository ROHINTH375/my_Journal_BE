// Canonical keyword taxonomy for author/reviewer profiles — spans the three
// domains Lattice publishes across (see SITE_DESCRIPTION on the frontend:
// "sciences, humanities, and social sciences"). Registration and profile
// edits both validate against this list server-side, so it's the one place
// to add/remove terms.
const KEYWORDS = [
  // Sciences
  'Climate Science', 'Genomics', 'Neuroscience', 'Microbiology', 'Ecology',
  'Astrophysics', 'Materials Science', 'Quantum Computing', 'Computational Biology',
  'Immunology', 'Epidemiology', 'Chemistry', 'Environmental Science', 'Data Science',
  'Machine Learning', 'Artificial Intelligence', 'Mathematics', 'Statistics',
  'Physics', 'Renewable Energy',
  // Social Sciences
  'Sociology', 'Political Science', 'Economics', 'Public Policy', 'Anthropology',
  'Psychology', 'Behavioral Science', 'Education Research', 'Urban Studies',
  'Demography', 'International Relations', 'Criminology', 'Social Networks',
  'Development Studies', 'Gender Studies', 'Public Health', 'Communication Studies',
  'Labor Studies', 'Migration Studies', 'Cognitive Science',
  // Humanities
  'Philosophy', 'History', 'Linguistics', 'Literary Studies', 'Cultural Studies',
  'Ethics', 'Religious Studies', 'Art History', 'Musicology', 'Archaeology',
  'Media Studies', 'Rhetoric', 'Comparative Literature', 'Digital Humanities',
  'Postcolonial Studies',
  // Cross-cutting / methods
  'Interdisciplinary Methods', 'Science and Technology Studies', 'Research Ethics',
  'Qualitative Methods', 'Quantitative Methods'
];

module.exports = KEYWORDS;
