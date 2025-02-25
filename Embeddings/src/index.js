import OpenAI from "openai";
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const client = new OpenAI({
    apiKey:process.env.OPENAI_API_KEY,
})

const generateEmbeddings = async (text) => {
    const response = await client.embeddings.create({
        model:"text-embedding-3-small",
        input:text,
    })
    console.log(response.data);
    return response;
}

export const loadInputJson = (fileName) => {
    const path = join(__dirname, fileName);
    const rawInputData = readFileSync(path);
    return JSON.parse(rawInputData.toString());
  };
  const saveEmbeddingsToJson = (embeddings,fileName) => {
    const embeddingsString = JSON.stringify(embeddings);
    const buffer = Buffer.from(embeddingsString);
    const path = join(__dirname, fileName);
    writeFileSync(path, buffer);
    console.log(`Embeddings saved to ${path}`);
  };

  const main = async () => {
    const input = loadInputJson("input.json");
    const embeddings = await generateEmbeddings(input);
    const dataWithEmbeddings = input.map(
      (input, index) => ({
        input,
        embeddings: embeddings.data[index].embedding,
      })
    );
    saveEmbeddingsToJson(dataWithEmbeddings, "dataWithEmbeddings1.json");
  };
  
  main();