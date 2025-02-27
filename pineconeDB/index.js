import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const indexName = 'learning-pincone-db';
// creating a index
const createIndex = async () =>{
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
// Namespace means divide indexs in subgroups 
const createNameSpace = async () =>{
    const index = await getIndex();
    const namespace = index.namespace("learning-namespace");
    return namespace;
}
// Generate random vectors
const generateRandomVectors = (length) => {
  return Array.from({ length }, () => Math.random());
};
const upsertVectors = async () =>{
    try {
      const index = await getIndex();
      // console.log("index",index);
      
    const embedding = generateRandomVectors(1536);
    const res = await index.upsert([
      {
        "id": "2",   // Unique ID
        "values": embedding, // Embedding Vector
        "metadata": {
          "name": "test2",
          "age": 20,
          "gender": "male"
        }
      }
    ]);
    console.log("Upsert record successfully");
    // console.log(res," ++++++++++++++++++++++++++");
    } catch (error) {
      console.log("error",error);
      
    }
    
}

const queryVectors = async () =>{
    const index = await getIndex();
    const query = await index.query({
        "id": "2",
        topK: 1,
        includeMetadata: true,
      });
    console.log(query);
}
const listIndex = async () =>{
    const indexList = await pc.listIndexes();
    console.log(indexList);
}

const getIndex = async () =>{
    const index = pc.index("learning-pincone-db");
    return index;
}
const describeIndex = async () =>{
    const decribeData = await pc.describeIndex('learning-pincone-db');
    console.log(decribeData);
}
const createCollection = async () =>{
    const res = await pc.createCollection({
        name: "learning-collection",
        source: "learning-pincone-db",
      });
    console.log(res);
}
const main = async () =>{
    // await createIndex();
    // await listIndex();
    // await getIndex();
    // await describeIndex();
    // await createCollection();
    // await upsertVectors();
    await queryVectors();
}

main();