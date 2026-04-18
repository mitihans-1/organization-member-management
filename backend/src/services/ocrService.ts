import Tesseract from 'tesseract.js';

interface ExtractedData {
    transactionId: string | null;
    amount: number | null;
    date: string | null;
    rawText: string;
    isTelebirr: boolean;
    isCbeBirr: boolean;
}

export const extractReceiptData = async (imagePath: string): Promise<ExtractedData> => {
    // Run OCR on the image
    const { data: { text } } = await Tesseract.recognize(imagePath, 'eng');

    const lowerText = text.toLowerCase();
    const isTelebirr = lowerText.includes('telebirr');
    const isCbeBirr = lowerText.includes('cbe') || lowerText.includes('commercial bank');

    // Regex patterns to match Telebirr/CBE success screen formatting
    // You will need to fine-tune these based on actual real-world screenshots
    const txnMatch = text.match(/(?:Transaction ID|Txn ID|Ref No)[:\s]*([A-Za-z0-9]+)/i);
    const amountMatch = text.match(/(?:Amount|Birr)[:\s]*([0-9,.]+)/i);
    const dateMatch = text.match(/(?:Date)[:\s]*(\d{2,4}[-/]\d{1,2}[-/]\d{1,2})/i);

    const amountStr = amountMatch ? amountMatch[1].replace(/,/g, '') : null;

    return {
        transactionId: txnMatch ? txnMatch[1].trim() : null,
        amount: amountStr ? parseFloat(amountStr) : null,
        date: dateMatch ? dateMatch[1].trim() : null,
        rawText: text,
        isTelebirr,
        isCbeBirr
    };
};
