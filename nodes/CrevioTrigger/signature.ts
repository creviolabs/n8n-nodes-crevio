import { createHmac, timingSafeEqual } from 'crypto';
import type { IDataObject } from 'n8n-workflow';

const SIGNATURE_TOLERANCE_SECONDS = 5 * 60;

export function isValidSignature(
	secret: string,
	headers: IDataObject,
	rawBody: string,
	nowSeconds = Math.floor(Date.now() / 1000),
): boolean {
	const id = headers['webhook-id'];
	const timestamp = headers['webhook-timestamp'];
	const signatures = headers['webhook-signature'];
	if (typeof id !== 'string' || typeof timestamp !== 'string' || typeof signatures !== 'string') {
		return false;
	}
	if (Math.abs(nowSeconds - Number(timestamp)) > SIGNATURE_TOLERANCE_SECONDS) return false;

	const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
	const expected = createHmac('sha256', key).update(`${id}.${timestamp}.${rawBody}`).digest();

	return signatures.split(' ').some((entry) => {
		const [version, signature] = entry.split(',');
		if (version !== 'v1' || !signature) return false;
		const given = Buffer.from(signature, 'base64');
		return given.length === expected.length && timingSafeEqual(given, expected);
	});
}
