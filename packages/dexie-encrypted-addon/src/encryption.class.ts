import { decode as decodeBase64, encode as encodeBase64 } from '@stablelib/base64';
import { decode as decodeUtf8, encode as encodeUtf8 } from '@stablelib/utf8';
import { hash, randomBytes, secretbox } from 'tweetnacl';

/**
 * Class with cryptic methods
 */
export class Encryption {

    private readonly _secret: string;
    public get secret() { return this._secret; }

    private readonly _keyUint8Array: Uint8Array;
    public get secretUint8Array(): Uint8Array { return this._keyUint8Array; }

    /**
     * Create a random key.
     */
    public static createRandomEncryptionKey(): string {
        return encodeBase64(randomBytes(32));
    }

    /**
     * Create a base64 hash string of the provided input.
     * @param input Any non-circulair value.
     */
    public static hash(input: any): string {
        const messageUint8Array = encodeUtf8(JSON.stringify(input));
        const hashUint8Array = hash(messageUint8Array);
        const base64FullMessage = encodeBase64(hashUint8Array);
        const shortString = base64FullMessage.slice(11, 31);
        return shortString;
    }

    /**
     * Encrypt any value.
     * @param json Any non-circulair value.
     */
    public encrypt(json: any): string {
        if (!json) { return json; }

        const nonce = randomBytes(secretbox.nonceLength);
        const messageUint8 = encodeUtf8(JSON.stringify(json));
        const box = secretbox(messageUint8, nonce, this.secretUint8Array);

        const fullMessage = new Uint8Array(nonce.length + box.length);
        fullMessage.set(nonce);
        fullMessage.set(box, nonce.length);

        const base64FullMessage = encodeBase64(fullMessage);
        return base64FullMessage;
    }

    /**
     * Decrypt values.
     * @param json Any non-circulair value.
     */
    public decrypt(messageWithNonce: string): any {
        const messageWithNonceAsUint8Array = decodeBase64(messageWithNonce);
        const nonce = messageWithNonceAsUint8Array.slice(0, secretbox.nonceLength);
        const message = messageWithNonceAsUint8Array.slice(
            secretbox.nonceLength,
            messageWithNonce.length
        );

        const decrypted = secretbox.open(message, nonce, this.secretUint8Array);

        if (!decrypted) {
            throw new Error('Could not decrypt message!');
        }

        const base64DecryptedMessage = decodeUtf8(decrypted);
        return JSON.parse(base64DecryptedMessage);
    }

    constructor(
        secret?: string
    ) {
        secret ?
            this._secret = secret :
            this._secret = Encryption.createRandomEncryptionKey();

        this._keyUint8Array = decodeBase64(this._secret);
    }

}

