import type { NextApiRequest, NextApiResponse } from 'next';
import { getServices } from '../../lib/server/container';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const seed = req.body;
    if (!seed || !seed.title || !seed.genre_tags || !seed.tone || !seed.setting || !seed.cast) {
      return res.status(400).json({ error: 'Missing required fields', required: ['title', 'genre_tags', 'tone', 'setting', 'cast'] });
    }
    const { episodes } = getServices();
    const result = await episodes.planEpisode(seed);
    return res.status(200).json(result);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
}

