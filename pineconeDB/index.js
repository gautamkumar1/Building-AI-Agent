import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const indexName = 'learning-pincone-db';

const main = async () =>{
    await pc.createIndex({
        name: indexName,
        dimension: 1536, 
        metric: 'cosine', 
        spec: { 
          serverless: { 
            cloud: 'aws', 
            region: 'us-east-1' 
          }
        } 
      });
}

// main();