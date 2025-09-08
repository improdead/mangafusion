import type { NextApiRequest, NextApiResponse } from 'next';
import { getServices } from '../../../../lib/server/container';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (!id || Array.isArray(id)) return res.status(400).json({ error: 'Invalid id' });
  const { episodes } = getServices();

  try {
    if (req.method === 'GET') {
      const page = await episodes.getPageById(id);
      if (!page) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json({ overlays: page.overlays || [] });
    }
    if (req.method === 'POST') {
      const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const overlays = payload?.overlays ?? payload;
      await episodes.setPageOverlays(id, overlays);
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
}

