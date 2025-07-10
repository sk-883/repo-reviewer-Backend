import weaviate from 'weaviate-client';

// Initialize Weaviate client
const client = weaviate.client({
  scheme: process.env.WEAVIATE_SCHEME || 'http',
  host: process.env.WEAVIATE_HOST,      // e.g. 'localhost:8080'
  apiKey: new weaviate.ApiKey(process.env.WEAVIATE_API_KEY)
});

export default client;