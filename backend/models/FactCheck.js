import mongoose from 'mongoose';

const sourceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String },
  credibilityScore: { type: Number, min: 0, max: 100 },
  stance: { type: String, enum: ['supports', 'contradicts', 'neutral'], default: 'neutral' },
  excerpt: { type: String },
});

const claimSourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  publisher: { type: String, required: true },
  publicationDate: { type: String },
  url: { type: String },
});

const claimSchema = new mongoose.Schema({
  text: { type: String, required: true },
  verdict: { type: String, default: 'unverified' },
  explanation: { type: String },
  confidence: { type: Number, min: 0, max: 100 },
  supportingEvidence: { type: String },
  sourceComparison: { type: String },
  unsupportedStatements: { type: String },
  reasoningSummary: { type: String },
  evidenceStatus: { type: String },
  sources: [claimSourceSchema],
});

const evidenceDetailSchema = new mongoose.Schema({
  claimIndex: { type: Number, default: 0 },
  query: { type: String },
  sourceTitle: { type: String, required: true },
  publisher: { type: String, required: true },
  url: { type: String },
  publicationDate: { type: String },
  relevanceScore: { type: Number, min: 0, max: 100 },
  stance: { type: String, enum: ['supports', 'contradicts', 'neutral', 'context'], default: 'neutral' },
  excerpt: { type: String },
  credibilityRating: { type: Number, min: 0, max: 100 },
  corroboratingRecordsCount: { type: Number, default: 1 },
});

const reasoningStepSchema = new mongoose.Schema({
  step: { type: Number, required: true },
  stage: { type: String, required: true }, // 'Claim Extraction', 'Evidence Retrieval', 'Cross-Corroboration', 'Synthesis & Verdict'
  title: { type: String, required: true },
  details: { type: String, required: true },
  status: { type: String, enum: ['verified', 'flagged', 'neutral', 'investigating'], default: 'verified' },
});

const discrepancySchema = new mongoose.Schema({
  claimText: { type: String, required: true },
  assertedFact: { type: String, required: true },
  verifiedFact: { type: String, required: true },
  severity: { type: String, enum: ['Critical', 'Moderate', 'Minor', 'None'], default: 'Minor' },
});

const keyEntitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['Person', 'Organization', 'Location', 'Metric', 'Event', 'Other'], default: 'Other' },
  context: { type: String },
});

const toneBiasAnalysisSchema = new mongoose.Schema({
  tone: { type: String, default: 'Neutral / Informational' },
  objectivityScore: { type: Number, min: 0, max: 100, default: 85 },
  sentiment: { type: String, enum: ['Positive', 'Neutral', 'Negative', 'Mixed'], default: 'Neutral' },
  estimatedReadTime: { type: String, default: '1 min read' },
});

const factCheckSchema = new mongoose.Schema({
  // Input
  inputType: { type: String, enum: ['url', 'text', 'headline'], default: 'text' },
  inputContent: { type: String, required: true },
  title: { type: String },

  // Analysis Results
  verdict: {
    type: String,
    enum: ['TRUE', 'MOSTLY_TRUE', 'MISLEADING', 'MOSTLY_FALSE', 'FALSE', 'UNVERIFIED'],
    default: 'UNVERIFIED'
  },
  truthScore: { type: Number, min: 0, max: 100, default: 0 },
  summary: { type: String },

  // Summarization Feature additions
  executiveSummary: { type: String },
  keyTakeaways: [{ type: String }],
  toneBiasAnalysis: toneBiasAnalysisSchema,
  keyEntities: [keyEntitySchema],

  // Evidence Retrieval & Explanation Feature additions
  claims: [claimSchema],
  sources: [sourceSchema],
  evidenceDetails: [evidenceDetailSchema],
  reasoningChain: [reasoningStepSchema],
  discrepancies: [discrepancySchema],
  overallExplanation: { type: String },

  // Metadata
  category: {
    type: String,
    enum: ['Politics', 'Health', 'Science', 'Economy', 'Technology', 'Environment', 'World', 'Other'],
    default: 'Other'
  },
  processingTime: { type: Number }, // in ms
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'completed' },

  // User info & Analyst tracking
  analystId: { type: String, default: 'anonymous' },
  userEmail: { type: String, default: 'anonymous@veritas.ai' },
  userName: { type: String, default: 'Anonymous Analyst' },
  organization: { type: String, default: 'Independent Investigator' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual for verdict label
factCheckSchema.virtual('verdictLabel').get(function () {
  const labels = {
    TRUE: 'True',
    MOSTLY_TRUE: 'Mostly True',
    MISLEADING: 'Misleading',
    MOSTLY_FALSE: 'Mostly False',
    FALSE: 'False',
    UNVERIFIED: 'Unverified',
  };
  return labels[this.verdict] || 'Unverified';
});

// Index for faster queries and history retrieval
factCheckSchema.index({ createdAt: -1 });
factCheckSchema.index({ verdict: 1 });
factCheckSchema.index({ category: 1 });
factCheckSchema.index({ userEmail: 1, createdAt: -1 });

const FactCheck = mongoose.model('FactCheck', factCheckSchema);

export default FactCheck;

