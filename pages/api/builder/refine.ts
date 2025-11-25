import type { NextApiRequest, NextApiResponse } from 'next';
import { getServices } from '../../../lib/server/container';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const { builder } = getServices();
    const result = await builder.refinePrompt(prompt);

    return res.status(200).json(result);
  } catch (e: any) {
    console.error('Builder refine error:', e);
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
