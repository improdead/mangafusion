import type { NextApiRequest, NextApiResponse } from 'next';
import { getServices } from '../../../../lib/server/container';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (!id || Array.isArray(id)) return res.status(400).json({ error: 'Invalid id' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { episodes } = getServices();
  try {
    const page = await episodes.retryPage(id);
    return res.status(200).json(page);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
}

