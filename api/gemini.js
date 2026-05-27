import { GoogleGenAI } from '@google/genai';

const DEFAULT_MODEL = 'gemini-2.5-flash';

function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);

  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    res.status(500).json({
      error: 'GEMINI_API_KEY is not configured on the server.',
    });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const { contents, config, model } = body;

    if (!Array.isArray(contents) || contents.length === 0) {
      res.status(400).json({ error: 'contents is required.' });
      return;
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: model || process.env.GEMINI_MODEL || DEFAULT_MODEL,
      contents,
      config,
    });

    res.status(200).json({ text: response.text ?? '' });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message.includes('403') || message.includes('PERMISSION_DENIED') ? 403 : 500;

    res.status(status).json({ error: message });
  }
}
