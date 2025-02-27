import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const faqSingaporeInfo = `
Singapore is a city-state in Southeast Asia. Founded as a British trading colony in 1819, since independence it has become one of the world's most prosperous countries and boasts the world's busiest port. Combining the skyscrapers and subways of a modern, affluent city with a medley of Chinese, Malay and Indian influences and a tropical climate, with tasty food, good shopping and a vibrant night-life scene, this Garden City makes a great stopover or springboard into the region. It has a total land area of 724.2 square kilometers and a population of 5.88 million people.`;

const faqIndiaInfo = `
India, officially the Republic of India, is a country in South Asia. It is the seventh-largest country by land area, the second-most populous country, and the most populous democracy in the world. Bounded by the Indian Ocean on the south, the Arabian Sea on the southwest, and the Bay of Bengal on the southeast, it shares land borders with Pakistan to the west; China, Nepal, and Bhutan to the north; and Bangladesh and Myanmar to the east. In the Indian Ocean, India is in the vicinity of Sri Lanka and the Maldives; its Andaman and Nicobar Islands share a maritime border with Thailand, Myanmar and Indonesia. It has a total land area of 3.287 million square kilometers and a population of 1.34 billion people.`;

const faqAustraliaInfo = `
Australia is a country and continent surrounded by the Indian and Pacific oceans. Its major cities – Sydney, Brisbane, Melbourne, Perth, Adelaide – are coastal. Its capital, Canberra, is inland. The country is known for its Sydney Opera House, the Great Barrier Reef, a vast interior desert wilderness called the Outback, and unique animal species like kangaroos and duck-billed platypuses. It has a total land area of 7.692 million square kilometers and a population of 25.4 million people.`;

const dataToEmbed = [
  {
    faqInfo: faqSingaporeInfo,
    reference: "Singapore",
    relevance: 0.93,
  },
  {
    faqInfo: faqIndiaInfo,
    reference: "India",
    relevance: 0.77,
  },
  {
    faqInfo: faqAustraliaInfo,
    reference: "Australia",
    relevance: 0.88,
  },
];

const indexName = 'learning-pincone-db';
const getIndex = async (indexName) =>{
    const index = pc.index(indexName);
    return index;
}

const generateEmbeddings = async (text) =>{
    const res = await client.embeddings.create({
        model:"text-embedding-3-small",
        input: text,
    })
    return res.data[0].embedding;
}


const storeEmbeddings = async () =>{
    try {
        const indexdb = await getIndex(indexName);
        await Promise.all(
            dataToEmbed.map( async (data,index)=>{
                const embedding = await generateEmbeddings(data.faqInfo);
                await indexdb.upsert([{
                    id: `id-${index}`,
                    values: embedding,
                    metadata: {
                        faqInfo: data.faqInfo,
                        relevance: data.relevance,
                    }
                }])
            })
        )
    } catch (error) {
        console.log(`Error: ${error.message}`);
        
    }
}

const searchEmbeddings = async (question) =>{
    const questionEmbeddings = await generateEmbeddings(question);
    const index = await getIndex(indexName);
    const result = await index.query({
        vector: questionEmbeddings,
        topK: 1,
        includeMetadata: true,
        includeValues: true,  
    })
    return result.matches[0].metadata;  
}

const FaqAI = async (question,relevantInfo) =>{
    const completion = await client.chat.completions.create({
        model:"gpt-3.5-turbo",
        messages: [
            {
                role: "system",
                content: `Answer the next question using the information provided: ${relevantInfo}
                `,
            },
            {
                role: "user",
                content: question
            },
        ],
        temperature:0
    })
    return completion.choices[0].message.content;
}

const main = async () =>{
    // await storeEmbeddings();
    const question = "What is the population of India?";
    const searchEmbeddingsResult = await searchEmbeddings(question);
    const FaqAIResponse = await FaqAI(question,searchEmbeddingsResult);
    console.log(`FAQ-AI: ${FaqAIResponse}`);
    
}
main();