import type { NextApiRequest, NextApiResponse } from 'next';
import { getServices } from '../../lib/server/container';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[API /api/planner] Request received');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const seed = req.body;
    console.log('[API /api/planner] Seed:', JSON.stringify(seed, null, 2));
    if (!seed || !seed.title || !seed.genre_tags || !seed.tone || !seed.setting || !seed.cast) {
      return res.status(400).json({ error: 'Missing required fields', required: ['title', 'genre_tags', 'tone', 'setting', 'cast'] });
    }
    console.log('[API /api/planner] Getting services...');
    const { episodes } = getServices();
    console.log('[API /api/planner] Services loaded, calling planEpisode...');
    const result = await episodes.planEpisode(seed);
    console.log('[API /api/planner] planEpisode completed, episodeId:', result.episodeId);
    return res.status(200).json(result);
  } catch (e: any) {
    console.error('[API /api/planner] Error:', e?.message || String(e), e?.stack);
    return res.status(500).json({ error: e?.message || String(e) });
  }
}

