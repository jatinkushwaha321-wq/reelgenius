import { ApifyClient } from 'apify-client';

const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;

let cachedClient = null;

export function getApifyClient() {
  if (!APIFY_API_TOKEN) {
    throw new Error('APIFY_API_TOKEN is not defined in environment variables');
  }

  if (!cachedClient) {
    cachedClient = new ApifyClient({
      token: APIFY_API_TOKEN,
    });
  }

  return cachedClient;
}
