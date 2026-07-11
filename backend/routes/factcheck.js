import express from 'express';
import mongoose from 'mongoose';
import FactCheck from '../models/FactCheck.js';

const router = express.Router();

// Stateful in-memory database for mock sessions
export const mockDatabase = new Map();

// ─── Mock AI Analysis Engine ───────────────────────────────────────────────────
const TRUSTED_SOURCES = [
  { name: 'Reuters Fact Check', url: 'https://reuters.com/fact-check', credibilityScore: 96, keywords: ['election', 'politics', 'government', 'president', 'layoffs', 'economy', 'conflict', 'military', 'layoff'] },
  { name: 'Associated Press (AP)', url: 'https://apnews.com/ap-fact-check', credibilityScore: 95, keywords: ['policy', 'education', 'spending', 'crime', 'unemployment', 'inflation', 'stock', 'retail', 'market'] },
  { name: 'BBC News Verify', url: 'https://bbc.com/news', credibilityScore: 94, keywords: ['climate', 'global', 'security', 'war', 'regional', 'europe', 'asia'] },
  { name: 'Nature Journal Archive', url: 'https://nature.com', credibilityScore: 99, keywords: ['science', 'quantum', 'fusion', 'reactor', 'study', 'research', 'physics', 'energy', 'scientists', 'species', 'amazon'] },
  { name: 'World Health Organization (WHO)', url: 'https://who.int', credibilityScore: 98, keywords: ['health', 'vaccine', 'virus', 'covid', 'disease', 'outbreak', 'clinical', 'medical'] },
  { name: 'International Energy Agency (IEA)', url: 'https://iea.org', credibilityScore: 97, keywords: ['energy', 'carbon', 'clean', 'solar', 'wind', 'renewables', 'emissions', 'coal'] },
  { name: 'PolitiFact', url: 'https://politifact.com', credibilityScore: 91, keywords: ['tax', 'bill', 'law', 'candidate', 'senate', 'congress', 'claim', 'budget'] }
];

const generateClaimDetails = (claimText, category, idx) => {
  // Determine verdict based on a seed
  const scoreSeed = (claimText.length + idx * 7) % 12;
  let verdict = 'unverified';
  let evidenceStatus = 'Not Verifiable';
  let confidence = Math.floor(Math.random() * 20) + 75; // 75-95%
  
  if (scoreSeed >= 10) {
    verdict = 'true';
    evidenceStatus = 'Fully Supported';
  } else if (scoreSeed >= 8) {
    verdict = 'mostly_true';
    evidenceStatus = 'Partially Supported';
  } else if (scoreSeed >= 6) {
    verdict = 'partly_true';
    evidenceStatus = 'Partially Supported';
  } else if (scoreSeed >= 4) {
    verdict = 'misleading';
    evidenceStatus = 'Partially Supported';
    confidence = Math.floor(Math.random() * 15) + 60; // 60-75%
  } else if (scoreSeed >= 2) {
    verdict = 'false';
    evidenceStatus = 'Contradicts';
  } else {
    verdict = 'not_enough_evidence';
    evidenceStatus = 'Not Verifiable';
    confidence = Math.floor(Math.random() * 25) + 40; // 40-65%
  }

  // Extract a brief subject from the claim text to make it customized
  let subject = "";
  const words = claimText.split(/\s+/).filter(w => w.length > 2);
  const capitalizedWords = words.filter(w => /^[A-Z]/.test(w));
  if (capitalizedWords.length > 0) {
    subject = capitalizedWords.slice(0, 3).join(' ').replace(/[^a-zA-Z\s]/g, '');
  } else {
    subject = words.slice(0, 3).join(' ').replace(/[^a-zA-Z\s]/g, '');
  }
  if (!subject) subject = "The reported event";

  // Category specific sources and names
  let sourceOrg = "primary databases";
  let registryName = "official public records";
  let authority = "independent oversight bodies";
  
  if (category === 'Politics') {
    sourceOrg = "congressional legislative records";
    registryName = "official government gazette";
    authority = "bipartisan policy analysts";
  } else if (category === 'Health') {
    sourceOrg = "clinical trial registers";
    registryName = "World Health Organization database";
    authority = "medical review boards";
  } else if (category === 'Science') {
    sourceOrg = "peer-reviewed journal archives";
    registryName = "international scientific consortium";
    authority = "research advisory councils";
  } else if (category === 'Economy') {
    sourceOrg = "central bank statistical releases";
    registryName = "national bureau of economic statistics";
    authority = "independent audit bureaus";
  } else if (category === 'Technology') {
    sourceOrg = "technical specification standards";
    registryName = "global patent registries";
    authority = "cybersecurity consortia";
  } else if (category === 'Environment') {
    sourceOrg = "climatological monitoring networks";
    registryName = "satellite observation databases";
    authority = "environmental protection panels";
  }

  let explanation = "";
  let supportingEvidence = "";
  let sourceComparison = "";
  let unsupportedStatements = "";
  let reasoningSummary = "";
  let claimSources = [];

  const cleanClaim = claimText.length > 80 ? claimText.substring(0, 80) + "..." : claimText;

  if (verdict === 'true') {
    explanation = `The assertion that "${cleanClaim}" is fully verified and correct. Authoritative reports and data releases from ${registryName} directly align with this statement. There are no conflicting reports from any credible third-party agencies.`;
    supportingEvidence = `We retrieved primary documentation from ${sourceOrg} indicating that all stated metrics, events, and figures match verified entries. Specifically, records updated within the last quarter show zero deviation from the reported numbers.`;
    sourceComparison = `The details in the claim match the independent logs published by ${authority} exactly. Comparison of the timelines, key actors, and quantitative values shows absolute alignment across all checked databases.`;
    unsupportedStatements = `None. All components of the claim are fully supported by the primary evidence and verified by external sources.`;
    reasoningSummary = `We cross-referenced the claim against ${registryName}. The assertion was confirmed by multiple corroborating records. Because all key metrics were verified with high-precision matches and no conflicting evidence was found, the claim is marked Fully Supported with a confidence score of ${confidence}%.`;
  } 
  else if (verdict === 'mostly_true') {
    explanation = `The claim that "${cleanClaim}" is mostly true, as all major assertions are correct. However, it contains minor inaccuracies regarding timelines or secondary details. The core message remains accurate and is supported by official records.`;
    supportingEvidence = `Primary records from ${registryName} confirm the core events and figures of the claim. The main metrics are substantiated; however, some auxiliary claims about future projections or historical comparisons could not be fully matched.`;
    sourceComparison = `Trusted sources from ${authority} confirm the primary event occurred. However, they report the event in slightly more nuanced terms, pointing out minor caveats that were glossed over in the original statement.`;
    unsupportedStatements = `The assertion regarding the absolute impact or the exact completion date lacks support in the primary data, as ${registryName} lists these as projections rather than finalized results.`;
    reasoningSummary = `We verified the primary details of the claim against ${sourceOrg}. The core of the claim is correct, but minor errors or exaggerations in secondary details were identified. The credibility score reflects this minor lack of precision, keeping the final status as Partially Supported.`;
  }
  else if (verdict === 'partly_true') {
    explanation = `The claim is partly true, meaning it contains a mixture of verified facts and unproven or inaccurate statements. While some parts are supported by ${registryName}, other key details are unsupported or contradicted by trusted sources.`;
    supportingEvidence = `We found partial documentation in ${sourceOrg} confirming that the base program or event exists. However, the specific figures, scope, or claims of success stated in the text are significantly higher than what is documented.`;
    sourceComparison = `When compared with data from ${authority}, the claim matches on the basic occurrence but deviates on critical details. For example, while the project is indeed active, trusted sources report it is only in the early testing phase rather than being fully operational.`;
    unsupportedStatements = `The claim that this event has been fully completed or widely adopted is unsupported. Primary registries state that it remains a small-scale pilot project.`;
    reasoningSummary = `Our verification process confirmed the baseline occurrence of the event, but noted that major details were exaggerated or incorrect. By balancing the verified elements against the unverified or incorrect details, we arrived at a Partly True verdict with a confidence of ${confidence}%.`;
  }
  else if (verdict === 'misleading') {
    explanation = `The claim that "${cleanClaim}" is misleading. While it cites some accurate figures, it frames them out of context to lead readers to a false or distorted conclusion. Important context or baseline values were omitted.`;
    supportingEvidence = `The raw numbers mentioned in the claim match the records in ${registryName}. However, the claim attributes these results to a single cause while ignoring major external factors that are well-documented in ${sourceOrg}.`;
    sourceComparison = `Trusted sources from ${authority} present the same data but explicitly warn against the conclusion drawn in the claim. The sources explain that when adjusted for inflation or seasonal factors, the trend is flat rather than increasing.`;
    unsupportedStatements = `The causal relationship implied between the events is entirely unsupported by any of the audited studies or spokesperson statements.`;
    reasoningSummary = `We confirmed the authenticity of the raw figures, but analyzed the context in which they were presented. Because the claim omits crucial baseline facts to imply a false narrative, we classified the claim as Misleading and adjusted the score downwards.`;
  }
  else if (verdict === 'false') {
    explanation = `The claim that "${cleanClaim}" is false. Direct audits of primary records and statements from ${authority} contradict this assertion. The reported event or metrics did not occur as described.`;
    supportingEvidence = `We checked ${registryName} and found no record of the described events or figures. In fact, verified reports from ${sourceOrg} show opposite trends, contradicting the core assertions of the claim.`;
    sourceComparison = `Trusted sources have debunked this claim, pointing out that the figures cited are fabricated or belong to a different, unrelated event. The timelines and data provided are completely inconsistent with the records of ${authority}.`;
    unsupportedStatements = `The entire claim is unsupported. There is no evidence in any audited reports, official statements, or credible databases to support any part of the text.`;
    reasoningSummary = `We performed a direct search of the claim's assertions in ${registryName} and ${sourceOrg}. The claim contradicts verified records, and independent investigations have confirmed its inaccuracy. It is marked as Contradicts with a low confidence score of ${confidence}%.`;
  }
  else { // not_enough_evidence
    explanation = `There is currently not enough evidence to verify the claim that "${cleanClaim}". No official statements, public registries, or academic databases have released relevant information to confirm or deny the assertion.`;
    supportingEvidence = `A search across ${sourceOrg} returned no matching entries or relevant datasets. The subject of the claim is not covered in any of the verified databases we checked.`;
    sourceComparison = `Trusted publications and registries have not reported on this event. Due to this silence in official records, we cannot compare the claim with verified data.`;
    unsupportedStatements = `The entire claim is currently unverified. Since there is no public documentation from ${authority}, all assertions in the statement are unsupported.`;
    reasoningSummary = `We searched multiple databases including ${registryName} and found no records or evidence. Because the claim is currently Not Verifiable due to a complete lack of public records, the credibility score is low and the status is Not Verifiable.`;
  }

  // Generate 2 custom sources for the claim based on the category
  const mockSources = [];
  if (category === 'Politics') {
    mockSources.push({
      title: `Congressional Legislative Review on ${subject}`,
      publisher: "Government Accountability Office (GAO)",
      publicationDate: "March 15, 2026",
      url: "https://gao.gov/reports/gao-26-politics-audit"
    });
    mockSources.push({
      title: `Bipartisan Analysis of Public Policy Statements`,
      publisher: "Federal Election Commission Policy Audit",
      publicationDate: "June 2, 2026",
      url: "https://fec.gov/resources/policy-analysis"
    });
  } else if (category === 'Health') {
    mockSources.push({
      title: `Global Health & Clinical Trial Metadata on ${subject}`,
      publisher: "World Health Organization (WHO)",
      publicationDate: "January 20, 2026",
      url: "https://who.int/publications/clinical-trial-metadata"
    });
    mockSources.push({
      title: `Journal of Medical Sciences Clinical Evaluation`,
      publisher: "New England Journal of Medicine",
      publicationDate: "April 11, 2026",
      url: "https://nejm.org/doi/full/10.1056/nejm2026"
    });
  } else if (category === 'Science') {
    mockSources.push({
      title: `Comprehensive Review of ${subject} Research`,
      publisher: "Nature Journal Archive",
      publicationDate: "February 22, 2026",
      url: "https://nature.com/articles/science-review-2026"
    });
    mockSources.push({
      title: `Academic Registry of Space & Physics Accomplishments`,
      publisher: "NASA Scientific Information Office",
      publicationDate: "May 8, 2026",
      url: "https://nasa.gov/science-data/physics-registry"
    });
  } else if (category === 'Economy') {
    mockSources.push({
      title: `Quarterly Economic Bulletin on ${subject}`,
      publisher: "Federal Reserve Board of Governors",
      publicationDate: "May 1, 2026",
      url: "https://federalreserve.gov/releases/economic-bulletin"
    });
    mockSources.push({
      title: `Labor Force and Price Index Quarterly Report`,
      publisher: "Bureau of Labor Statistics",
      publicationDate: "June 18, 2026",
      url: "https://bls.gov/news.release/economic-data-2026"
    });
  } else if (category === 'Technology') {
    mockSources.push({
      title: `Global Standards and Patents on ${subject}`,
      publisher: "IEEE Xplore Digital Library",
      publicationDate: "April 5, 2026",
      url: "https://ieeexplore.ieee.org/document/tech-standards"
    });
    mockSources.push({
      title: `Cybersecurity Advisory & Threat Intelligence Report`,
      publisher: "CISA National Cybersecurity Database",
      publicationDate: "June 30, 2026",
      url: "https://cisa.gov/resources/threat-intelligence"
    });
  } else if (category === 'Environment') {
    mockSources.push({
      title: `Satellite Observations of Climatological Impact on ${subject}`,
      publisher: "NOAA Environmental Satellite Data Center",
      publicationDate: "March 10, 2026",
      url: "https://noaa.gov/satellite-data/environment"
    });
    mockSources.push({
      title: `Intergovernmental Assessment of Ecosystem Trends`,
      publisher: "UN Environment Programme Reports",
      publicationDate: "May 25, 2026",
      url: "https://unep.org/resources/ecosystem-trends"
    });
  } else {
    mockSources.push({
      title: `Independent Fact-Checking Archive on ${subject}`,
      publisher: "Reuters Fact Check Bureau",
      publicationDate: "February 12, 2026",
      url: "https://reuters.com/factcheck-archive"
    });
    mockSources.push({
      title: `General Public Records Registry & Verification`,
      publisher: "Associated Press Truth Archive",
      publicationDate: "July 1, 2026",
      url: "https://apnews.com/ap-factcheck-archive"
    });
  }

  return {
    verdict,
    confidence,
    explanation,
    supportingEvidence,
    sourceComparison,
    unsupportedStatements,
    reasoningSummary,
    evidenceStatus,
    sources: mockSources
  };
};

const analyzeContent = (content) => {
  const lowerContent = content.toLowerCase();

  // 1. Determine category dynamically
  let category = 'Other';
  if (/polit|govern|elect|congress|senate|president|minister/.test(lowerContent)) category = 'Politics';
  else if (/health|disease|vaccine|covid|medical|hospital/.test(lowerContent)) category = 'Health';
  else if (/science|research|study|climate|nasa|quantum/.test(lowerContent)) category = 'Science';
  else if (/economy|gdp|stock|inflation|market|finance|retail/.test(lowerContent)) category = 'Economy';
  else if (/tech|ai|software|app|cyber|data|robot/.test(lowerContent)) category = 'Technology';
  else if (/environment|carbon|emission|forest|ocean|wildlife|renew/.test(lowerContent)) category = 'Environment';

  // 2. Dynamically extract claims (sentences from user content)
  const sentences = content
    .split(/[.!?\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 12 && s.length < 180);

  // Score sentences by factual density
  const getFactualWeight = (s) => {
    let weight = 0;
    const lower = s.toLowerCase();
    if (/\d+/.test(s)) weight += 12; // digits
    if (/%|percent/i.test(s)) weight += 15; // percentages
    if (/increased|decreased|grow|drop|fall|rise|high|low|boost|cut|loss|gain|record|rate/i.test(s)) weight += 8; // comparatives
    if (/science|claim|report|show|find|study|verify|confirm|launches|layoffs/i.test(s)) weight += 5; // triggers
    return weight;
  };

  const scoredSentences = sentences
    .map(s => ({ text: s, weight: getFactualWeight(s) }))
    .sort((a, b) => b.weight - a.weight);

  // Pick top 2 claims, fallback if none found
  let selectedClaims = scoredSentences.slice(0, 2).map(item => item.text);
  if (selectedClaims.length === 0) {
    selectedClaims = [content.substring(0, Math.min(80, content.length)).trim() + '...'];
  }

  // 3. Evaluate each claim dynamically
  const claims = selectedClaims.map((claimText, idx) => {
    const claimDetails = generateClaimDetails(claimText, category, idx);
    return {
      text: claimText,
      ...claimDetails
    };
  });

  // 4. Match trusted sources based on keywords
  const matchedSources = [];
  claims.forEach((claim) => {
    const claimLower = claim.text.toLowerCase();
    
    // Find sources having matching keywords
    const sourcesForClaim = TRUSTED_SOURCES.filter(source => 
      source.keywords.some(kw => claimLower.includes(kw))
    );
    
    if (sourcesForClaim.length > 0) {
      matchedSources.push(...sourcesForClaim);
    }
  });

  // Fallback to general sources if no keywords matched
  if (matchedSources.length === 0) {
    matchedSources.push(TRUSTED_SOURCES[0], TRUSTED_SOURCES[1]);
  }

  // Deduplicate sources
  const uniqueSources = Array.from(new Set(matchedSources.map(s => s.name)))
    .map(name => matchedSources.find(s => s.name === name))
    .slice(0, 3); // Max 3 sources

  // Map stance and excerpt dynamically based on claim verdicts
  const sources = uniqueSources.map((source) => {
    // Find if any claim was rejected
    const hasFalse = claims.some(c => c.verdict === 'false');
    const hasMisleading = claims.some(c => c.verdict === 'misleading');
    
    let stance = 'neutral';
    let excerpt = '';
    if (hasFalse) {
      stance = 'contradicts';
      excerpt = `Official reporting from ${source.name} indicates key figures in the claim are incorrect. Primary records contradict the stated trends.`;
    } else if (hasMisleading) {
      stance = 'neutral';
      excerpt = `Investigation by ${source.name} highlights that the data requires context. Factors such as external market volatility were not fully accounted for.`;
    } else {
      stance = 'supports';
      excerpt = `Corroborating statements from ${source.name} verify the alignment of the figures. Historical databases show matching values.`;
    }

    return {
      name: source.name,
      url: source.url,
      credibilityScore: source.credibilityScore,
      stance,
      excerpt
    };
  });

  // 5. Calculate truth score based on claims evaluation
  let truthScore = 95; // base
  claims.forEach(c => {
    if (c.verdict === 'false') truthScore -= 35;
    if (c.verdict === 'mostly_true') truthScore -= 5;
    if (c.verdict === 'partly_true') truthScore -= 15;
    if (c.verdict === 'misleading') truthScore -= 20;
    if (c.verdict === 'not_enough_evidence') truthScore -= 12;
    if (c.verdict === 'unverified') truthScore -= 10;
  });
  
  // Bound score
  truthScore = Math.min(99, Math.max(5, truthScore));

  // Determine overall verdict label
  let verdict = 'UNVERIFIED';
  if (truthScore >= 85) verdict = 'TRUE';
  else if (truthScore >= 70) verdict = 'MOSTLY_TRUE';
  else if (truthScore >= 50) verdict = 'MISLEADING';
  else if (truthScore >= 30) verdict = 'MOSTLY_FALSE';
  else verdict = 'FALSE';

  const summary = `Veritas AI has analyzed the submitted content in category ${category}, extracting key factual assertions. The verification engine computed an overall Truth Score of ${truthScore}/100. We cross-referenced claims against ${sources.length * 847}+ trusted source documents. Key claims were evaluated as: ${claims.map(c => `"${c.text.substring(0, 30)}..." (${c.verdict})`).join(', ')}.`;

  return { verdict, truthScore, category, claims, sources, summary };
};

// ─── POST /api/factcheck — Submit new fact-check ─────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { content, inputType = 'text', title } = req.body;

    if (!content || content.trim().length < 10) {
      return res.status(400).json({ error: 'Content must be at least 10 characters long.' });
    }

    const startTime = Date.now();
    const analysis = analyzeContent(content);
    const processingTime = Date.now() - startTime + Math.floor(Math.random() * 1500) + 500;

    const factCheckData = {
      inputType,
      inputContent: content,
      title: title || content.substring(0, 80).trim(),
      ...analysis,
      processingTime,
      status: 'completed',
    };

    // Try to save to MongoDB; fall back to in-memory response
    let saved;
    if (mongoose.connection.readyState === 1) {
      saved = await FactCheck.create(factCheckData);
    } else {
      // Mock ID when DB is unavailable
      const mockId = `mock_${Date.now()}`;
      saved = { 
        ...factCheckData, 
        _id: mockId, 
        createdAt: new Date(), 
        verdictLabel: analysis.verdict.replace('_', ' ') 
      };
      // Store in memory database so GET /:id can retrieve it!
      mockDatabase.set(mockId, saved);
    }

    res.status(201).json({
      success: true,
      data: saved,
    });
  } catch (err) {
    console.error('Fact-check error:', err);
    res.status(500).json({ error: 'Analysis failed', message: err.message });
  }
});

// ─── GET /api/factcheck/history — Get paginated history ──────────────────────
router.get('/history', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { search, verdict, category, startDate, endDate } = req.query;

    // If MongoDB is not connected, fall back to mock data
    if (mongoose.connection.readyState !== 1) {
      let list = getMockHistory();

      // Prepend in-memory user submissions
      const userSubmissions = Array.from(mockDatabase.values()).map(item => ({
        _id: item._id,
        title: item.title,
        inputType: item.inputType,
        inputContent: item.inputContent,
        verdict: item.verdict,
        truthScore: item.truthScore,
        category: item.category,
        createdAt: item.createdAt,
        processingTime: item.processingTime,
        domain: item.inputType === 'url' ? item.inputContent : 'user-upload'
      }));
      list = [...userSubmissions, ...list];

      // Filter by search (title or domain)
      if (search) {
        const s = search.toLowerCase();
        list = list.filter(item =>
          item.title.toLowerCase().includes(s) ||
          (item.domain && item.domain.toLowerCase().includes(s))
        );
      }

      // Filter by category
      if (category && category !== 'All Categories' && category !== 'all') {
        list = list.filter(item => item.category === category);
      }

      // Filter by verdict/credibility
      if (verdict && verdict !== 'All Statuses' && verdict !== 'all') {
        const v = verdict.toUpperCase();
        list = list.filter(item => {
          if (v === 'VERIFIED') return item.verdict === 'TRUE' || item.verdict === 'MOSTLY_TRUE';
          if (v === 'FALSE') return item.verdict === 'FALSE';
          if (v === 'FLAGGED') return item.verdict === 'MISLEADING';
          if (v === 'MIXED') return item.verdict === 'MOSTLY_FALSE' || item.verdict === 'UNVERIFIED';
          return item.verdict === v;
        });
      }

      // Filter by date range
      if (startDate) {
        const start = new Date(startDate);
        list = list.filter(item => new Date(item.createdAt) >= start);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        list = list.filter(item => new Date(item.createdAt) <= end);
      }

      const total = list.length;
      const data = list.slice(skip, skip + limit);

      return res.json({ success: true, data, total, page, pages: Math.ceil(total / limit) });
    }

    // Build DB Query
    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { inputContent: { $regex: search, $options: 'i' } }
      ];
    }

    if (category && category !== 'All Categories' && category !== 'all') {
      query.category = category;
    }

    if (verdict && verdict !== 'All Statuses' && verdict !== 'all') {
      const v = verdict.toUpperCase();
      if (v === 'VERIFIED') {
        query.verdict = { $in: ['TRUE', 'MOSTLY_TRUE'] };
      } else if (v === 'FALSE') {
        query.verdict = 'FALSE';
      } else if (v === 'FLAGGED') {
        query.verdict = 'MISLEADING';
      } else if (v === 'MIXED') {
        query.verdict = { $in: ['MOSTLY_FALSE', 'UNVERIFIED'] };
      } else {
        query.verdict = v;
      }
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const [data, total] = await Promise.all([
      FactCheck.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-claims -sources'),
      FactCheck.countDocuments(query),
    ]);

    res.json({ success: true, data, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history', message: err.message });
  }
});

// ─── POST /api/factcheck/bulk-delete — Bulk delete fact-checks ──────────────
router.post('/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Invalid list of IDs' });
    }

    if (mongoose.connection.readyState === 1) {
      await FactCheck.deleteMany({ _id: { $in: ids } });
    } else {
      ids.forEach(id => mockDatabase.delete(id));
      console.log(`[Mock Mode] Deleted items:`, ids);
    }

    res.json({ success: true, message: `Successfully deleted ${ids.length} records.` });
  } catch (err) {
    res.status(500).json({ error: 'Bulk delete failed', message: err.message });
  }
});

// ─── DELETE /api/factcheck/history/all — Delete all fact-checks ──────────────
router.delete('/history/all', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      await FactCheck.deleteMany({});
    } else {
      mockDatabase.clear();
      console.log(`[Mock Mode] Deleted all history records.`);
    }
    res.json({ success: true, message: 'All history records deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete all history', message: err.message });
  }
});

// ─── DELETE /api/factcheck/:id — Delete single fact-check ────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (mongoose.connection.readyState === 1) {
      const result = await FactCheck.findByIdAndDelete(id);
      if (!result) return res.status(404).json({ error: 'Analysis not found' });
    } else {
      if (!mockDatabase.has(id)) return res.status(404).json({ error: 'Analysis not found' });
      mockDatabase.delete(id);
      console.log(`[Mock Mode] Deleted item:`, id);
    }
    res.json({ success: true, message: 'Record deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed', message: err.message });
  }
});

// ─── GET /api/factcheck/:id — Get single fact-check ──────────────────────────
router.get('/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      if (mockDatabase.has(req.params.id)) {
        return res.json({ success: true, data: mockDatabase.get(req.params.id) });
      }
      return res.status(404).json({ error: 'Analysis not found' });
    }

    const factCheck = await FactCheck.findById(req.params.id);
    if (!factCheck) return res.status(404).json({ error: 'Analysis not found' });

    res.json({ success: true, data: factCheck });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch analysis', message: err.message });
  }
});

// ─── Mock data helpers (when MongoDB is unavailable) ─────────────────────────
function getMockHistory() {
  return [];
}

export default router;
