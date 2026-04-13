import crypto from 'crypto';

export class TelebirrUtils {
  /**
   * Generates a sign string for Telebirr requests
   * @param params Object containing request parameters
   * @param appSecret Telebirr App Secret
   * @returns Signed string
   */
  static generateSign(params: Record<string, any>, appSecret: string): string {
    const sortedKeys = Object.keys(params).sort();
    const signString = sortedKeys
      .map((key) => `${key}=${params[key]}`)
      .join('&');
    
    // Add appSecret or according to Telebirr spec
    // Usually it's key=value&key=value then sign with RSA
    return signString;
  }

  /**
   * RSA Sign with Private Key
   * @param data String to sign
   * @param privateKey RSA Private Key (PEM format)
   * @returns Base64 encoded signature
   */
  static signWithRSA(data: string, privateKey: string): string {
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(data);
    sign.end();
    return sign.sign(privateKey, 'base64');
  }

  /**
   * RSA Decrypt with Public Key (for notifications)
   * @param encryptedData Base64 encoded encrypted data
   * @param publicKey RSA Public Key (PEM format)
   * @returns Decrypted string
   */
  static decryptWithRSA(encryptedData: string, publicKey: string): string {
    const buffer = Buffer.from(encryptedData, 'base64');
    const decrypted = crypto.publicDecrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      buffer
    );
    return decrypted.toString('utf8');
  }

  /**
   * Encrypt with Public Key (for some request payloads)
   * @param data Data to encrypt
   * @param publicKey RSA Public Key
   * @returns Base64 encoded encrypted data
   */
  static encryptWithRSA(data: string, publicKey: string): string {
    const buffer = Buffer.from(data, 'utf8');
    const encrypted = crypto.publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      buffer
    );
    return encrypted.toString('base64');
  }
}
