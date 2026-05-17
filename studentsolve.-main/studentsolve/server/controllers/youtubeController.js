import openai from '../utils/openai.js';
import { fetchTranscript } from '../utils/transcriptFetcher.js';

export async function generateNotes(req, res) {
  const { url } = req.body;

  let transcript;
  try {
    transcript = await fetchTranscript(url);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  const systemPrompt = `You are an expert study notes generator. You transform video transcripts into clear, well-structured revision notes that students can actually use to study and revise effectively.

You respond ONLY with valid JSON. No text outside the JSON object.`;

  const userPrompt = `Generate comprehensive study notes from the following video transcript.

Transcript:
"""
${transcript.text.substring(0, 8000)}
"""

Respond ONLY with this exact JSON structure:
{
  "title": "<inferred or generated title for the topic covered>",
  "summary": "<2-3 sentence overview of what the video covers>",
  "keyPoints": [
    "<key point 1>",
    "<key point 2>",
    "<key point 3>",
    "<key point 4>",
    "<key point 5>"
  ],
  "detailedNotes": "<comprehensive study notes in markdown format, with headings, bullet points, and examples where appropriate. Minimum 400 words. Cover all major topics discussed.>"
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 2000,
      temperature: 0.4,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0].message.content;
    const notes = JSON.parse(raw);
    res.json(notes);
  } catch (err) {
    console.error('[YouTube Notes Error]', err.message);
    res.status(500).json({ error: 'Failed to generate notes. Please try again.' });
  }
}
