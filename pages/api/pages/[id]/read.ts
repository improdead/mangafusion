import type { NextApiRequest, NextApiResponse } from 'next';
import { getServices } from '../../../../lib/server/container';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (!id || Array.isArray(id)) return res.status(400).json({ error: 'Invalid id' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { episodes, tts } = getServices();
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const page = await episodes.getPageById(id);
    if (!page) return res.status(404).json({ error: 'Page not found' });
    const dialogues = await episodes.getPageDialogue(id);
    if (!dialogues || dialogues.length === 0) return res.status(400).json({ error: 'No dialogues found for this page' });
    const result = await tts.generatePageAudio(dialogues, body?.voice_id);
    return res.status(200).json({ audioUrl: result.audioUrl, dialogues });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
}

