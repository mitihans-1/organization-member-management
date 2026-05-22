import { Request, Response } from 'express';

export const uploadAttachment = async (req: any, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileUrl = req.file.path.replace(/\\/g, '/');
    const fileType = req.file.mimetype.startsWith('image/') ? 'image' : 'file';

    res.status(201).json({
      url: fileUrl,
      type: fileType,
      filename: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading file', error });
  }
};
