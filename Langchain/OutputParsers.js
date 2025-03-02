import {ChatPromptTemplate} from "@langchain/core/prompts"
import {ChatOpenAI} from "@langchain/openai"
import {StringOutputParser} from "@langchain/core/output_parsers"
import {CommaSeparatedListOutputParser} from "@langchain/core/output_parsers"
import { StructuredOutputParser } from "langchain/output_parsers";


const model = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    apiKey: process.env.OPENAI_API_KEY,
    temperature: 0,
    maxTokens: 1000,
})
// String Output Parser means it will parse the ai output as a string so we can directly print the response 

const stringOutputParser = async () => {
    const prompt = ChatPromptTemplate.fromTemplate(
        "What is the capital of {country}?"
    );
    const inceptionPrompt = await prompt.format({
        country: "India",
    });
    const stringParser = new StringOutputParser();
    const chain = prompt.pipe(model).pipe(stringParser);
    const result = await chain.invoke({
        country: "India",
    });
    console.log(result);
}

// CommaSeparatedListOutputParser means it will parse the ai response that comes in seprated so it will add the all the elments with seprated in array.
/*
Example: Without using CommaSeparatedListOutputParser Ai response is Like this 
The Shawshank Redemption, Forrest Gump, The Godfather, Schindler's List, Titanic, The Green Mile

Now using CommaSeparatedListOutputParser Ai Response like this
[
  'The Shawshank Redemption',
  'Forrest Gump',
  "Schindler's List",
  'The Godfather',
  'Titanic',
  'A Beautiful Mind'
]
*/
const commaSeparatedListOutputParser = async () => {
    const prompt = ChatPromptTemplate.fromTemplate(
        "Provide six movies, separated by commas, for the genre: {genre}. Make it comma separated. And don't add numbered list"
    );
    const inceptionPrompt = await prompt.format({
        genre: "drama",
    });
    const commaParser = new CommaSeparatedListOutputParser();
    const chain = prompt.pipe(model).pipe(commaParser);
    const result = await chain.invoke({
        genre: "drama",
    });
    console.log(result);
}

const structuredOutputParser = async () => {
    const prompt = ChatPromptTemplate.fromTemplate(
        `Extract information from the following text.
        Formatting instructions: {formattingInstructions}
        Text: {text}
        `
    )
    // -- 👉 This part tells the AI what kind of information you need from the text.
    /*
    *************** Real-Life Example 💪 ******************
Imagine you're building a Resume Extraction App 📄.

If someone gives this text: 👉 "My name is John. I'm 25 years old and I love cricket and books"

✅ This part will tell the AI:

Extract the name as "John"
Extract the age as 25
Extract the interests as ["cricket", "books"]
    */
    const structuredParser = StructuredOutputParser.fromNamesAndDescriptions({
        name: "the name of the user",
        age: "the age of the user",
        interests: "what the user is interested in",
    })
    const chain = prompt.pipe(model).pipe(structuredParser)
    /*
    👉 This line calls the AI model and passes:

The text to extract data from
The formatting instructions that tell the AI how to structure the output.
    */
    const result = await chain.invoke({
        text: "John is 25 years old and he is interested in reading books and playing cricket",
        formattingInstructions: structuredParser.getFormatInstructions(),
    })
    console.log(result);
}
const main = async () =>{
    // await stringOutputParser();
    // await commaSeparatedListOutputParser();
    await structuredOutputParser();
    
}
main();
