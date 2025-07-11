import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'


import weaviate from 'weaviate-client';


const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)

dotenv.config({ path: join(__dirname, '../.env') })
/// Initialize Weaviate client
// const client = weaviate.client({
//   scheme: process.env.WEAVIATE_SCHEME || 'http',
//   host: process.env.WEAVIATE_HOST,      // e.g. 'localhost:8080'
//   apiKey: new weaviate.ApiKey(process.env.WEAVIATE_API_KEY)
// });

const weaviateURL = process.env.WEAVIATE_URL;
const weaviateApiKey = process.env.WEAVIATE_API_KEY;

console.log("Connecting to Weaviate at", weaviateURL);
console.log("Using API Key", weaviateApiKey);

// Best practice: store your credentials as environment variables
// WEAVIATE_URL       your Weaviate instance URL
// WEAVIATE_API_KEY   your Weaviate instance API Key

export const weaviateClient= await weaviate.connectToWeaviateCloud(weaviateURL, {
    authCredentials: new weaviate.ApiKey(weaviateApiKey),
  }
)
// export const weaviateClient = weaviate.client({
//   scheme: 'https',
//   host: weaviateURL,      // e.g. "6dvpr86crfoo1spsox5tia.c0.asia-southeast1.gcp.weaviate.cloud"
//   apiKey: weaviateApiKey,
//   // ← disable gRPC health‐check at startup
//   skipInitChecks: true,
//   // ← or increase timeout if your network is slow
//   timeout: {
//     init: 30000,   // 30s instead of the default
//   },
// });