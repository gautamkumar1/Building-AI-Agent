import 'dotenv/config'
import axios from "axios";
import * as cheerio from 'cheerio';
import OpenAI from 'openai';
import { ChromaClient } from "chromadb";

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const chromaClient = new ChromaClient({ path: "http://localhost:8000" });
// const collection = await chromaClient.createCollection({
//     name: 'WEB_AI_COLLECTION'
// });
// Helper function to get or create collection
async function getOrCreateCollection(collectionName) {
    try {
        const collection = await chromaClient.getCollection({
            name: collectionName
        });
        // console.log(`Using existing collection: ${collectionName}`);
        return collection;
    } catch (error) {
        if (error.message?.includes('Collection not found')) {
            const collection = await chromaClient.createCollection({
                name: collectionName
            });
            console.log(`Created new collection: ${collectionName}`);
            return collection;
        }
        throw error;
    }
}

const scrapWebPage = async (url) => {
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        const pageHead = $('head').html();
        const pageBody = $('body').html();
        const externalLinks = new Set();
        const internalLinks = new Set();
        
        $('a').each((_, el) => {
            const links = $(el).attr('href');
            if (!links || links === "/") return;
            if (links.startsWith("http") || links.startsWith("https")) {
                externalLinks.add(links);
            } else {
                internalLinks.add(links);
            }
        });

        return {
            body: pageBody,
            head: pageHead,
            externalLinks: Array.from(externalLinks),
            internalLinks: Array.from(internalLinks)
        };
    } catch (error) {
        console.error(`Error scraping ${url}:`, error.message);
        throw error;
    }
}

const generateVectorEmbedding = async ({ text }) => {
    try {
        const embedding = await client.embeddings.create({
            model: "text-embedding-3-small",
            input: text,
            encoding_format: "float",
        });
        return embedding.data[0].embedding;
    } catch (error) {
        console.error('Error generating embedding:', error.message);
        throw error;
    }
}

function chunkText(text, size) {
    if (typeof text !== 'string' || typeof size !== 'number' || size <= 0) {
        throw new Error("Invalid input: text should be a string and size should be a positive number.");
    }

    return text.match(new RegExp(`.{1,${size}}`, 'g')) || [];
}

const insertIntoDB = async ({ embedding, url, body = '', head }) => {
    try {
        const collection = await getOrCreateCollection("WEB_AI_COLLECTION");
        // console.log(`Collection: ${collection}`);
        
        await collection.add({
            ids: [url],
            embeddings: [embedding],
            metadatas: [{ url, body, head }]
        });
    } catch (error) {
        console.error(`Error inserting data for ${url}:`, error.message);
        throw error;
    }
}

const processedUrls = new Set(); // Track processed URLs to avoid duplicates

const ingest = async (baseUrl = '') => {
    if (processedUrls.has(baseUrl)) {
        console.log(`Skipping already processed URL: ${baseUrl}`);
        return;
    }

    try {
        console.log(`----------------- Processing ${baseUrl} --------------------`);
        processedUrls.add(baseUrl);

        const { head, body, internalLinks } = await scrapWebPage(baseUrl);
        const bodyChunks = chunkText(body, 1000);

        for (const chunk of bodyChunks) {
            const bodyEmbedding = await generateVectorEmbedding({ text: chunk });
            await insertIntoDB({
                embedding: bodyEmbedding,
                url: baseUrl,
                head,
                body: chunk
            });
        }

        // Process internal links
        // for (const link of internalLinks) {
        //     const fullUrl = link.startsWith('http') ? link : `${baseUrl}${link}`;
        //     if (!processedUrls.has(fullUrl)) {
        //         await ingest(fullUrl);
        //     }
        // }

        console.log(`----------------- Successfully processed ${baseUrl} --------------------`);
    } catch (error) {
        console.error(`Error processing ${baseUrl}:`, error.message);
        // Continue with other URLs even if one fails
    }
}

// Main execution
// async function main() {
//     try {
//         await chromaClient.heartbeat();
//         // const collections = await chromaClient.listCollections();
//         // console.log("Existing Collections:", collections);

//         await ingest("https://www.piyushgarg.dev");
//         await ingest("https://www.piyushgarg.dev/cohort");
//         await ingest("https://www.piyushgarg.dev/about");
//     } catch (error) {
//         console.error("Fatal error:", error);
//         process.exit(1);
//     }
// }

// main();


const chat = async (question = '') => {
    try {
        const questionEmbedding = await generateVectorEmbedding({ text: question });
        const collection = await getOrCreateCollection("WEB_AI_COLLECTION");
        const queryResult = await collection.query({
            nResults:1,
            queryEmbeddings: questionEmbedding
        })
        const body = queryResult.metadatas[0].map((e)=>e.body).filter((e)=>e.trim()!=='' && !!e);
        // console.log(`Body: ${body}`);
        const head = queryResult.metadatas[0].map((e)=>e.head).filter((e)=>e.trim()!=='' && !!e);
        // console.log(`Head: ${head}`);
        const url = queryResult.metadatas[0].map((e)=>e.url).filter((e)=>e.trim()!=='' && !!e);
        // console.log(`Url: ${url}`);
        const res = await client.chat.completions.create({
            model:"gpt-4o",
            messages:[
                {role: "system", content: "You are AI support agnet expert in providing support to users on behalf of webpages. Given the context about page content ,reply the user accordingly." },
                {role:"user",content: `
                    Query: ${question}\n\n
                    Retrieved Context: ${body.join(', ')}
                    Urls: ${body.join(', ')}

                
                `}
            ]
        })
        
        console.log(`🤖: ${res.choices[0].message.content}`);
        
    } catch (error) {
        console.error('Error generating response:', error.message);
        throw error;
        
    }
}

chat("Who is Piyush Garg?");
