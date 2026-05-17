import openai from '../utils/openai.js';

const EXAM_BOARD_CONFIGS = {
  'Edexcel IGCSE': {
    aoStructure: [
      'AO1: Knowledge & Understanding',
      'AO2: Application & Analysis',
      'AO3: Evaluation & Judgement',
    ],
    maxMark: 20,
    gradeBoundaries: { 9: 19, 8: 17, 7: 15, 6: 13, 5: 11, 4: 9, 3: 7, 2: 5, 1: 3 },
  },
  'Edexcel GCSE': {
    aoStructure: [
      'AO1: Knowledge & Understanding',
      'AO2: Application & Analysis',
      'AO3: Evaluation & Judgement',
    ],
    maxMark: 20,
    gradeBoundaries: { 9: 19, 8: 17, 7: 15, 6: 13, 5: 11, 4: 9, 3: 7, 2: 5, 1: 3 },
  },
  AQA: {
    aoStructure: [
      'AO1: Knowledge & Understanding',
      'AO2: Application to Context',
      'AO3: Analysis & Evaluation',
    ],
    maxMark: 25,
    gradeBoundaries: { 9: 23, 8: 21, 7: 19, 6: 16, 5: 14, 4: 12, 3: 9, 2: 6, 1: 3 },
  },
};

function estimateGrade(mark, boundaries) {
  for (const [grade, threshold] of Object.entries(boundaries).sort(
    (a, b) => b[1] - a[1]
  )) {
    if (mark >= threshold) return grade;
  }
  return 'U';
}

export async function markEssay(req, res) {
  const { essayText, examBoard, subject, question = '' } = req.body;

  const config = EXAM_BOARD_CONFIGS[examBoard] || EXAM_BOARD_CONFIGS['Edexcel GCSE'];
  const aoList = config.aoStructure.join('\n- ');
  const maxMark = config.maxMark;

  const systemPrompt = `You are a senior examiner and essay marker with extensive experience in ${examBoard} ${subject} assessments. You mark essays strictly according to official mark schemes and examiner guidelines.

Your marking is:
- Rigorous and fair
- Based on genuine assessment objective criteria
- Detailed but concise in feedback
- Written in the style of a real examiner report

You must respond ONLY with a valid JSON object. No preamble, no explanation outside the JSON.`;

  const userPrompt = `Mark the following ${subject} essay for ${examBoard}.
${question ? `Question/Task: ${question}` : ''}
Maximum mark: ${maxMark}

Assessment Objectives to mark against:
- ${aoList}

Essay to mark:
"""
${essayText.substring(0, 6000)}
"""

Respond ONLY with this exact JSON structure (fill all fields accurately):
{
  "overallMark": <integer>,
  "maxMark": ${maxMark},
  "gradeEstimate": "<grade as string, e.g. 7 or B>",
  "aoBreakdown": [
    {
      "objective": "<AO name>",
      "score": <integer>,
      "maxScore": <integer>,
      "comment": "<specific feedback for this AO>"
    }
  ],
  "strengths": ["<specific strength 1>", "<specific strength 2>", "<specific strength 3>"],
  "improvements": ["<specific improvement 1>", "<specific improvement 2>", "<specific improvement 3>"],
  "examinerComment": "<2-3 sentence examiner-style summary comment>"
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 1500,
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0].message.content;
    const feedback = JSON.parse(raw);

    if (!feedback.gradeEstimate) {
      feedback.gradeEstimate = String(
        estimateGrade(feedback.overallMark, config.gradeBoundaries)
      );
    }

    res.json(feedback);
  } catch (err) {
    console.error('[Essay Error]', err.message);
    res.status(500).json({ error: 'Failed to mark essay. Please try again.' });
  }
}
