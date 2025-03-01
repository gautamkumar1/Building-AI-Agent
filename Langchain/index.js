import {ChatOpenAI} from "@langchain/openai";

const client = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    openAIApiKey: process.env.OPENAI_API_KEY,
    temperature: 0.5,
    maxTokens: 100,

});

const main = async () => {
    // -------------- 1. Invoke the model - Means asking the model a single question -------------- 
    /*
    const result = await client.invoke("What is the langchain framework?");
    console.log(result.content);
    */

    // --------------  2. Batch the model - Means asking the model a multiple questions -------------- 
    /* const result = await client.batch(["What is the langchain framework?", "What is the nodejs"]);
    result.map((AIMessage)=> console.log(AIMessage.content)
    )
    */
// --------------  3. Streaming the model - Streaming means receiving large data in small parts (chunks) instead of waiting for the entire data to arrive. -------------- 
const stream = await client.stream("Give recommendations for a book to learn about AI");
console.log(stream,"++++++++++++++++++++ \n");

for await (const chunk of stream) {
    console.log(chunk.content);
}

};



main();
