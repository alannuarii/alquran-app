import { decode } from 'html-entities';

/**
 * Decodes HTML entities from a string (e.g. &ldquo; -> “, &rdquo; -> ”, &lsquo; -> ‘, &rsquo; -> ’, &amp; -> &, etc.)
 */
export function decodeHtml(text?: string | null): string {
	if (!text) return '';
	return decode(text);
}

/**
 * Recursively decodes HTML entities across all string fields in an object or array.
 */
export function decodeHtmlEntities<T>(data: T): T {
	if (typeof data === 'string') {
		return decode(data) as unknown as T;
	}
	if (Array.isArray(data)) {
		return data.map((item) => decodeHtmlEntities(item)) as unknown as T;
	}
	if (data !== null && typeof data === 'object') {
		const result: Record<string, any> = {};
		for (const key of Object.keys(data)) {
			result[key] = decodeHtmlEntities((data as any)[key]);
		}
		return result as T;
	}
	return data;
}
