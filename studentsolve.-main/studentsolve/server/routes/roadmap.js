import express from 'express';
import Anthropic from '@anthropic-ai/sdk';

const router = express.Router();
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

router.post('/', async (req, res) => {
  const { university, degree, year, school, subjects, grades, doneAlready, extra, uploadedText } = req.body;

  if (!university || !degree || !year) {
    return res.status(400).json({ error: 'University, degree and year are required.' });
  }

  const prompt = `You are a brutally honest UK university admissions advisor with deep knowledge of what top universities actually want. A student wants a personalised roadmap.

Student profile:
- Target university: ${university}
- Desired degree: ${degree}
- Current year: ${year}
- School type: ${school || 'not specified'}
- Subjects: ${subjects?.join(', ') || 'not specified'}
- Current/predicted grades: ${grades || 'not specified'}
- What they have done already: ${doneAlready || 'nothing mentioned'}
- Additional context: ${extra || 'none'}
${uploadedText ? `- Uploaded document:\n${uploadedText.slice(0, 3000)}` : ''}

Generate a detailed, honest, personalised application roadmap. You must respond ONLY with a valid JSON object — no markdown, no preamble, no backticks.

PROBABILITY RULES (be strict — most applicants overestimate their chances):
- Oxford/Cambridge Economics, Law, Medicine, PPE: base 8-12%, even exceptional candidates rarely exceed 35-45%
- Oxford/Cambridge other courses: base 10-18%, strong candidates 25-40%
- Top London (LSE, Imperial, UCL) competitive courses: base 15-25%, strong candidates 35-55%
- Russell Group competitive: base 20-35%, strong candidates 40-65%
- Always apply a state school penalty of 3-8% for Oxbridge due to structural interview disadvantage
- Never give probability above 65% for any Oxbridge course
- Never give probability above 80% for any Russell Group course
- If grades are unknown or "not sure yet", apply a 5-10% uncertainty discount
- Be conservative — it is better to motivate than falsely reassure

ROADMAP REQUIREMENTS:
Each phase MUST include a mix of:
1. Academic tasks (grades, subject depth, entrance exams like LNAT/TSA/MAT/BMAT)
2. Supercurricular tasks — SPECIFIC competitions relevant to the degree (e.g. for Economics: Economics Olympiad, Bank of England competition; for Law: Mooting competitions, Bar Mock Trial; for Medicine: Biology Olympiad; for Maths: BMO, STEP)
3. Reading tasks — SPECIFIC books highly regarded for that subject at that university (e.g. for Economics: "The Worldly Philosophers" by Heilbroner, "Freakonomics", "Capital in the Twenty-First Century" by Piketty; for Philosophy: "Sophie's World", "The Republic"; for Law: "To Kill a Mockingbird" + legal theory texts)
4. Work experience / exposure tasks specific to the degree
5. Personal statement and interview preparation tasks

The JSON must have this exact structure:
{
  "probability": <integer 0-100, STRICT realistic offer probability — see rules above>,
  "baseProbability": <integer, base acceptance rate for this exact university/degree>,
  "probMessage": <string, 2-3 sentences explaining probability honestly including structural factors>,
  "caveat": <string, specific honest barriers this student faces that cannot be overcome by preparation alone>,
  "phases": [
    {
      "id": <string>,
      "title": <string>,
      "timeframe": <string>,
      "priority": <"critical" | "high" | "medium">,
      "tasks": [
        {
          "id": <string, unique>,
          "title": <string — include specific book titles, competition names, etc.>,
          "detail": <string, 2-4 sentences — specific, actionable, with named resources>,
          "priority": <"critical" | "high" | "medium">,
          "impact": <integer 1-5>
        }
      ]
    }
  ]
}

Rules:
- Generate 4-6 phases from now to offer
- Each phase must have 4-6 tasks
- Every phase must include at least one book recommendation and one competition/supercurricular specific to the degree
- Be SPECIFIC — name actual books, actual competitions, actual organisations
- Be honest about probability — do not inflate it
- Reference the uploaded document where relevant`;

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content[0].text.replace(/```json|```/g, '').trim();
    const roadmap = JSON.parse(raw);
    res.json(roadmap);
  } catch (err) {
    console.error('[Roadmap Error]', err.message);
    res.status(500).json({ error: 'Failed to generate roadmap.' });
  }
});

export default router;