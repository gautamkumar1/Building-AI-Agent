import { ChromaClient,OpenAIEmbeddingFunction } from "chromadb";
import OpenAI from "openai";
import readlinesync from "readline-sync";
const client = new ChromaClient({
    path: "http://localhost:8000"
});

const faqSingaporeInfo = `
Singapore is a city-state in Southeast Asia. Founded as a British trading colony in 1819, since independence it has become one of the world's most prosperous countries and boasts the world's busiest port. Combining the skyscrapers and subways of a modern, affluent city with a medley of Chinese, Malay and Indian influences and a tropical climate, with tasty food, good shopping and a vibrant night-life scene, this Garden City makes a great stopover or springboard into the region. It has a total land area of 724.2 square kilometers and a population of 5.88 million people.`;


const faqIndiaInfo = `
India, officially the Republic of India, is a country in South Asia. It is the seventh-largest country by land area, the second-most populous country, and the most populous democracy in the world. Bounded by the Indian Ocean on the south, the Arabian Sea on the southwest, and the Bay of Bengal on the southeast, it shares land borders with Pakistan to the west; China, Nepal, and Bhutan to the north; and Bangladesh and Myanmar to the east. In the Indian Ocean, India is in the vicinity of Sri Lanka and the Maldives; its Andaman and Nicobar Islands share a maritime border with Thailand, Myanmar and Indonesia. It has a total land area of 3.287 million square kilometers and a population of 1.3 billion people.`;


const faqAustraliaInfo = `
Australia is a country and continent surrounded by the Indian and Pacific oceans. Its major cities – Sydney, Brisbane, Melbourne, Perth, Adelaide – are coastal. Its capital, Canberra, is inland. The country is known for its Sydney Opera House, the Great Barrier Reef, a vast interior desert wilderness called the Outback, and unique animal species like kangaroos and duck-billed platypuses. It has a total land area of 7.692 million square kilometers and a population of 25.4 million people.`;
const embeddingFunction = new OpenAIEmbeddingFunction({
    openai_api_key: process.env.OPENAI_API_KEY,
    openai_model: "text-embedding-3-small"
});
const collectionName = "faq_collection"
const createCollection = async () => {
    try {
        const collection = await client.createCollection({
            name: collectionName,
            metadata: {
                "description": "FAQs about Singapore, India and Australia"
            }
        });
        console.log("Collection created:", collection);
    } catch (error) {
        console.error("Error creating collection:", error);
    }
};
const getCollection = async () => {
    try {
        const collection = await client.getCollection(
            { name: collectionName,
            embeddingFunction: embeddingFunction,
            },
        );
        return collection;
    } catch (error) {
        console.error("Error retrieving collection:", error);
    }
};

const getLLMResponse = async (question,relevantInfo) => {
    const client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
    const completion = await client.chat.completions.create({
        model: "gpt-3.5-turbo",
        temperature: 0,
        // This is called context Injection
        messages: [
            {
                role: "system",
                content: `Answer the next question using the information provided: ${relevantInfo}`,
            },
            {
                role: "user",
                content: question,
            },
        ],
    });
    const response = completion.choices[0].message.content;
    return response;
}
const addData = async () => {
    try {
        const collection = await getCollection();
        const response = await collection.add({
            ids: ["id1", "id2", "id3"],
            documents: [faqSingaporeInfo, faqIndiaInfo, faqAustraliaInfo]
        });
        console.log("Data added successfully!");
    } catch (error) {
        console.log("Error adding data: ", error);
        
    }
}

const askQuestion = async (query) =>{
    const collection = await getCollection();
    if (!collection) {
        console.log("Failed to retrieve collection. Please restart the database.");
        return;
    }
    const response = await collection.query({
        queryTexts: [query],
        nResults: 1
    })
    
    const relevantInfo = response.documents[0][0];
    if (relevantInfo) {
        const openaiRes = await getLLMResponse(query, relevantInfo);
        console.log(`AI: ${openaiRes}`);
    } 
    else{
        console.log("No relevant info found");
        
    }
}

const main = async () => {
    // await createCollection();
    // await addData();
    while (true) {
        const question = readlinesync.question("User: ")
        await askQuestion(question);
        if (question === "exit") {
            console.log("Exiting...");
            break;
        }
    }
}
main();

