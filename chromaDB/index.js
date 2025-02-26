import { ChromaClient,OpenAIEmbeddingFunction } from "chromadb";

const client = new ChromaClient({
    path: "http://localhost:8000"
});

const main = async () => {
    try {
        const collection = await client.createCollection({
            name: "my_collection2",
            metadata: {
                "description": "My first collection2"
            }
        });
        console.log("Collection created:", collection);
    } catch (error) {
        console.error("Error creating collection:", error);
    }
};
const embeddingFunction = new OpenAIEmbeddingFunction({
    openai_api_key: process.env.OPENAI_API_KEY, // Ensure this is set
    openai_model: "text-embedding-3-small"
});
const addData = async () => {
    try {
        const collection = await client.getCollection(
            { name: "my_collection2",
            embeddingFunction: embeddingFunction,
            },
            
        );
        const response = await collection.add({
            ids: ["id1", "id2"],
           // Embeddings are mandatory that genrated by openai 
            // embeddings: [[1, 2, 3], [4, 5, 6]],
            documents: ["This is my entry 1", "This is my entry 2"]
        });
        console.log("Data added successfully!");
        const results = await collection.get({ ids: ["id1", "id2"] });
        console.log("Retrieved Data:", results);
    } catch (error) {
        console.error("Error adding data:", error);
    }
};

const run = async () => {
    // await main();  
    await addData(); 
};

run();
