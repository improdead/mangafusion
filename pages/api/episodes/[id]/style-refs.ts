import type { NextApiRequest, NextApiResponse } from 'next';
import { getServices } from '../../../../lib/server/container';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (!id || Array.isArray(id)) return res.status(400).json({ error: 'Invalid id' });
  const { episodes } = getServices();

  if (req.method === 'GET') {
    try {
      const refs = await episodes.listStyleRefs(id);
      return res.status(200).json(refs);
    } catch (e: any) {
      return res.status(500).json({ error: e?.message || String(e) });
    }
  }

  if (req.method === 'POST') {
    try {
      const form = formidable({ multiples: false });
      const { fields, files } = await new Promise<{ fields: formidable.Fields; files: formidable.Files }>((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          else resolve({ fields, files });
        });
      });

      const f: any = (files as any).file ?? (Object.values(files)[0] as any);
      if (!f) return res.status(400).json({ error: 'No file uploaded' });

      // Read file buffer
      const toBuffer = async (file: any): Promise<Buffer> => {
        const fs = await import('fs');
        const fileObj = Array.isArray(file) ? file[0] : file;
        const path = (fileObj && (fileObj.filepath || fileObj.path || fileObj.tempFilePath || fileObj._writeStream?.path));
        if (typeof path !== 'string' || !path) throw new Error('Upload parse failed: no file path');
        return fs.readFileSync(path);
      };

      const buffer = await toBuffer(f);
      const uploaded = await episodes.uploadStyleRef(id, {
        buffer,
        originalname: (Array.isArray(f) ? f[0] : f)?.originalFilename || (Array.isArray(f) ? f[0] : f)?.newFilename || 'upload.png',
        mimetype: (Array.isArray(f) ? f[0] : f)?.mimetype || 'image/png',
      });
      return res.status(200).json(uploaded);
    } catch (e: any) {
      return res.status(500).json({ error: e?.message || String(e) });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
