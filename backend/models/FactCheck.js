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
  claims: [claimSchema],
  sources: [sourceSchema],

  // Metadata
  category: {
    type: String,
    enum: ['Politics', 'Health', 'Science', 'Economy', 'Technology', 'Environment', 'World', 'Other'],
    default: 'Other'
  },
  processingTime: { type: Number }, // in ms
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'completed' },

  // User info (optional)
  analystId: { type: String, default: 'anonymous' },
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

// Index for faster queries
factCheckSchema.index({ createdAt: -1 });
factCheckSchema.index({ verdict: 1 });
factCheckSchema.index({ category: 1 });

const FactCheck = mongoose.model('FactCheck', factCheckSchema);

export default FactCheck;
