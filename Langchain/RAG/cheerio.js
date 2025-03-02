import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import {OpenAIEmbeddings,ChatOpenAI} from "@langchain/openai"
import {MemoryVectorStore} from "langchain/vectorstores/memory"
import {ChatPromptTemplate} from "@langchain/core/prompts"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import  readlineSync  from "readline-sync";
const model = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    modelName: "gpt-3.5-turbo",
    temperature: 0,
});

const main = async (question) =>{
    // Create a web loader
  const loader = new CheerioWebBaseLoader(
        "https://gautam-dev-xd.vercel.app/"
  );
    const docs = await loader.load()
    // console.log(docs,"++++++++++++++++ Docs +++++++++++ \n")
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 300,
        chunkOverlap: 20,
      });
      // Splited the docs into chunks
    const chunks = await splitter.splitDocuments(docs)
    // console.log(chunks,"++++++++++++++++ Chunks +++++++++++ \n")
    // Create embeddings for the chunks
    const embeddings = new OpenAIEmbeddings()
    // Create a vector store to store the chunks
    const vectorStore = new MemoryVectorStore(embeddings)
    // Add the chunks to the vector store
    await vectorStore.addDocuments(chunks)
    // Create a retriever to retrieve the chunks
        const retriever = vectorStore.asRetriever({
        k:2 
    })
    // Retrieve the chunks
    const result = await retriever.invoke(question)
    const resultDocuments = result.map((doc) => doc.pageContent)
    // console.log(resultDocuments,"++++++++++++++++ Result Documents +++++++++++ \n")

    const promptTemplate = ChatPromptTemplate.fromMessages([
        [
          "system",
          "You're a chill and friendly AI assistant built for Gautam's personal portfolio website. Answer user questions in a helpful, casual, and informative way based on the following context: {context}. If the answer isn't in the context, just say 'I'm not sure, bro... but Gautam might help you out!' without hallucinating any extra information."
        ],
        ["user", "{query}"]
      ]);
    const chain = promptTemplate.pipe(model)
    const response = await chain.invoke({
        context: resultDocuments,
        query: question
    })
    console.log("AI: ",response.content)

}

while (true) {
    const question = readlineSync.question("You: ");
  
    if (question.toLowerCase() === "exit") {
      console.log("Goodbye, bro! 🔥👋");
      break;
    }
  
    await main(question);
  }
  
