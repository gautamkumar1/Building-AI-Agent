import { ChromaClient } from "chromadb";

const client = new ChromaClient({
    path: "http://localhost:8000"
});

const main = async () => {
    try {
        const collection = await client.createCollection({
            name: "my_collection",
            metadata: {
                "description": "My first collection"
            }
        });
        console.log("Collection created:", collection);
    } catch (error) {
        console.error("Error creating collection:", error);
    }
};

const addData = async () => {
    try {
        const collection = await client.getCollection({ name: "my_collection" });
        const response = await collection.add({
            ids: ["id1", "id2"],
           // Embeddings are mandatory that genrated by openai 
            embeddings: [[1, 2, 3], [4, 5, 6]],
            metadatas: [{ "key": "value" }, { "key": "value" }],
            documents: ["document1", "document2"]
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
