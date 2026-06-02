import fs from 'fs';
import multer from 'multer';
import path from 'path';

const ensureUploadDir = (dir: string) => {
    const uploadPath = path.join(__dirname, '../../', dir);
    if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
    }
};

// Set up storage logic
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        ensureUploadDir('uploads/receipts/');
        cb(null, 'uploads/receipts/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

// Create upload middleware, accepting a single image
export const uploadReceipt = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) return cb(null, true);
        cb(new Error('Only images (jpeg, jpg, png) are allowed!'));
    }
});

const generalStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        ensureUploadDir('uploads/images/');
        cb(null, 'uploads/images/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

export const uploadImage = multer({
    storage: generalStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) return cb(null, true);
        cb(new Error('Only images are allowed!'));
    }
});

const reportAttachmentStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        ensureUploadDir('uploads/reports/');
        cb(null, 'uploads/reports/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

export const uploadReportAttachment = multer({
    storage: reportAttachmentStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit for reports
    fileFilter: (req, file, cb) => {
        // Allow common document types
        const filetypes = /jpeg|jpg|png|pdf|doc|docx|txt|xls|xlsx/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        cb(null, true); // Allow all types for now
    }
});

const attachmentStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        ensureUploadDir('uploads/attachments/');
        cb(null, 'uploads/attachments/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

export const uploadAttachment = multer({
    storage: attachmentStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx|txt|xls|xlsx|zip/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        cb(null, true);
    }
});
