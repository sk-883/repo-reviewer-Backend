import client from './weaviateClient.js';

async function setupSchema() {
  // 1. Define Diff class
  const diffClass = {
    class: 'Diff',
    vectorizer: 'text2vec-openai',
    moduleConfig: {
      'text2vec-openai': {
        model: 'text-embedding-ada-002',
        apiKey: process.env.OPENAI_API_KEY
      }
    },
    properties: [
      { name: 'commitSha', dataType: ['string'] },
      { name: 'filePath',  dataType: ['string'] },
      { name: 'additions', dataType: ['int'] },
      { name: 'deletions', dataType: ['int'] },
      { name: 'patch',     dataType: ['text'] }
    ]
  };

  // Remove and recreate Diff class
  await client.schema.classDeleter().withClassName('Diff').do().catch(() => {});
  await client.schema.classCreator().withClass(diffClass).do();
  console.log('✅ Diff schema created');

  // 2. Define DiffReview class
  const reviewClass = {
    class: 'DiffReview',
    vectorizer: 'text2vec-openai',
    moduleConfig: {
      'text2vec-openai': {
        model: 'text-embedding-ada-002',
        apiKey: process.env.OPENAI_API_KEY
      }
    },
    properties: [
      { name: 'commitSha',      dataType: ['string'] },
      { name: 'filePath',       dataType: ['string'] },
      { name: 'summary',        dataType: ['text'] },
      { name: 'reviewComments', dataType: ['text'] },
      { name: 'insights',       dataType: ['text'] }
    ]
  };

  // Remove and recreate DiffReview class
  await client.schema.classDeleter().withClassName('DiffReview').do().catch(() => {});
  await client.schema.classCreator().withClass(reviewClass).do();
  console.log('✅ DiffReview schema created');
}

setupSchema().catch(err => console.error('Schema setup error:', err));
