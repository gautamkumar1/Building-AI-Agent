import {ChatOpenAI,OpenAIEmbeddings} from "@langchain/openai"
import {MemoryVectorStore} from "langchain/vectorstores/memory"
import {ChatPromptTemplate} from "@langchain/core/prompts"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
const model = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0.8,
  });
  
  const question = "How was this PDF created?";
const main = async () =>{
    const loader = new PDFLoader("./Pdfloader/sample-1.pdf",{
        splitPages: false,
      });
    const docs = await loader.load();
    // console.log(docs,"++++++++++++++++ Docs +++++++++++ \n")
    const splitter = new RecursiveCharacterTextSplitter({
        separators: [`. \n`],
    })
    const chunks = await splitter.splitDocuments(docs)
    // console.log(chunks,"++++++++++++++++ Chunks +++++++++++ \n")
    const embedding = new OpenAIEmbeddings();
    const vectorStore = new MemoryVectorStore(embedding)
    await vectorStore.addDocuments(chunks)
    const retrieve = await vectorStore.asRetriever({
        k:2
    })
    const result = await retrieve.invoke(question)
    const resultDocuments = result.map((doc)=>doc.pageContent)

    const prompt = ChatPromptTemplate.fromMessages([
        [
            "system",
            "Answer to users question based on the following context: {context}.",
          ],
          ["user", "{query}"],
    ])
    const chain = prompt.pipe(model)
    const response = await chain.invoke({
        context: resultDocuments,
        query: question,
    })
    console.log("Answer: ",response.content)

}

main();