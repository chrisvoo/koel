const config = {
  koelBaseUrl: process.env.KOEL_BASE_URL,
  defaultResultLimit: parseInt(process.env.DEFAULT_RESULT_LIMIT, 10) || 20,
  dynamoTableName: process.env.DYNAMO_TABLE_NAME || 'KoelAlexaPlaybackState',
  fallbackLocale: process.env.FALLBACK_LOCALE || 'en-US',
  queueSize: parseInt(process.env.QUEUE_SIZE, 10) || 50,
};

export default config;
