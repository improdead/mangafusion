import type { NextApiRequest, NextApiResponse } from 'next';
import { getServices } from '../../../lib/server/container';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { tts } = getServices();
  try {
    const usage = await tts.getUsage();
    return res.status(200).json(usage);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
}

