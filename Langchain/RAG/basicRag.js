import {ChatOpenAI,OpenAIEmbeddings} from "@langchain/openai"
import {ChatPromptTemplate} from "@langchain/core/prompts"
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import {Document} from "@langchain/core/documents"
import {StringOutputParser} from "@langchain/core/output_parsers"

const model = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    modelName: "gpt-3.5-turbo",
    temperature: 0,
});
const hardCodedData = [
    "My full name is John Doe",
    "I am a software engineer",
    "My favorite programming language is JavaScript",
    "My favorite programming language is also python",
    "My favorite programming language is also rust",
    "I love to play the guitar",
  ];
const question = "What is my favorite programming language?"
const main = async () =>{
    // Create embeddings for the hardcoded data
    const embeddings = new OpenAIEmbeddings();
    
const vectorStore = new MemoryVectorStore(embeddings);
 // Add documents to the vector store
 await vectorStore.addDocuments(
    hardCodedData.map((text) => new Document({ pageContent: text }))
  );
  const retriever = vectorStore.asRetriever({
    k:2
  })
  const result = await retriever.invoke(question)
  const resultDocuments = result.map((doc) => doc.pageContent)
//   console.log(result,"++++++++++++++++")

const promptTemplate = ChatPromptTemplate.fromMessages([
    [
        "system",
        "Answer to users question based on the following context: {context}.",
      ],
    ["user","{query}"]
])


const stringParser = new StringOutputParser()
const chain = promptTemplate.pipe(model).pipe(stringParser)
const response = await chain.invoke({
    query: question,
    context: resultDocuments
})
console.log(response)
}

main()
