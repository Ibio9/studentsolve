import openai from '../utils/openai.js';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';

export async function generateFlashcards(req, res) {
  let sourceText = '';

  if (req.file) {
    try {
      const pdfData = await pdfParse(req.file.buffer);
      sourceText = pdfData.text;
    } catch (err) {
      return res
        .status(400)
        .json({ error: 'Could not extract text from the uploaded PDF.' });
    }
  } else if (req.body.text && req.body.text.trim()) {
    sourceText = req.body.text.trim();
  } else {
    return res
      .status(400)
      .json({ error: 'Please provide either text content or a PDF file.' });
  }

  if (sourceText.length < 50) {
    return res
      .status(400)
      .json({ error: 'Content is too short to generate meaningful flashcards.' });
  }

  const systemPrompt = `You are an expert revision flashcard creator. You create high-quality, exam-focused flashcards from study material.

Rules for good flashcards:
- Each question tests one specific, important concept
- Answers are concise but complete (1-3 sentences)
- Avoid repetitive or trivial cards
- Cover the breadth of the material
- Use precise academic language appropriate to the topic
- Prioritise cards that would actually appear in exams

Respond ONLY with valid JSON.`;

  const userPrompt = `Generate revision flashcards from the following study material.

Content:
"""
${sourceText.substring(0, 6000)}
"""

Generate between 10 and 20 flashcards depending on the richness of the content.

Respond ONLY with this exact JSON structure:
{
  "title": "<topic or subject title inferred from the content>",
  "flashcards": [
    {
      "question": "<clear, specific question>",
      "answer": "<accurate, concise answer>"
    }
  ]
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 2500,
      temperature: 0.4,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0].message.content;
    const result = JSON.parse(raw);
    res.json(result);
  } catch (err) {
    console.error('[Flashcards Error]', err.message);
    res.status(500).json({ error: 'Failed to generate flashcards. Please try again.' });
  }
}
