export function validateServerEnvironment(env) {
  const requiredVars = [
    'MONGODB_URI',
    'AUTH_SECRET',
    'GEMINI_API_KEY',
    'APIFY_API_TOKEN'
  ];

  const missing = [];
  for (const v of requiredVars) {
    const val = env[v];
    if (typeof val !== 'string' || val.trim() === '') {
      missing.push(v);
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing required server environment variables: ${missing.join(', ')}`);
  }
}
