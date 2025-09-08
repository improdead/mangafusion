import type { NextApiRequest, NextApiResponse } from 'next';
import { getServices } from '../../../../lib/server/container';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (!id || Array.isArray(id)) return res.status(400).json({ error: 'Invalid id' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { episodes, events } = getServices();
  try {
    // Kick off generation without waiting (will emit SSE events)
    episodes.startGeneration(id).catch((err) => {
      events.emit(id, { type: 'page_failed', episodeId: id, page: -1 as any, error: err.message || String(err) } as any);
    });
    return res.status(200).json({ started: true });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
}

