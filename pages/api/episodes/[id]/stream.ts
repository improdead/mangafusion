import type { NextApiRequest, NextApiResponse } from 'next';
import { getServices } from '../../../../lib/server/container';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (!id || Array.isArray(id)) return res.status(400).end();
  if (req.method !== 'GET') return res.status(405).end();

  const { events } = getServices();

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');

  // Send initial comment to establish stream
  res.write(":ok\n\n");

  const subscription = events.stream(id).subscribe(({ data }) => {
    try {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch {
      // ignore write errors
    }
  });

  const onClose = () => {
    subscription.unsubscribe();
    try { res.end(); } catch {}
  };

  req.on('close', onClose);
}

