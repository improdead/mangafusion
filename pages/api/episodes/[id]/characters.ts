import type { NextApiRequest, NextApiResponse } from 'next';
import { getServices } from '../../../../lib/server/container';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (!id || Array.isArray(id)) return res.status(400).json({ error: 'Invalid id' });
  const { episodes } = getServices();
  if (req.method === 'GET') {
    const ep = await episodes.getEpisode(id);
    if (!ep) return res.status(404).json({ error: 'Not found' });
    return res.status(200).json({ characters: ep.characters || [] });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

