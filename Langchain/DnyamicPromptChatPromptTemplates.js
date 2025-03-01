import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";

const model = new ChatOpenAI({
  modelName: "gpt-3.5-turbo",
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0,
  maxTokens: 1000,
});
/*
++++++++++++++++++ Short Notes +++++++++++++++++++
Prompt - Question Template like "What is the capital of {country}?"
Placeholder - {country} – Dynamic Variable
Pipe - Connecting Prompt + Model
Invoke - Asking the AI model to generate the result
Chain - Prompt + Model + Invoke (A pipeline that connects everything)
*/
const fromTemplate = async () => {
    /*
    ------- 👉 This line creates a prompt template. ------- 

✅ Think of this like a fill-in-the-blank question.

Example: If the sentence is: 👉 "What is the capital of {country}?"

Then {country} is like an empty box 🔲 where you will pass the country name dynamically.
    */
    const prompt = ChatPromptTemplate.fromTemplate(
        "What is the capital of {country}?"
    );
    /*
    ************* Formatting the Prompt *************
    Here, the {country} placeholder will be replaced with "India".

So now the prompt becomes: 👉 "What is the capital of India?"
    */
    const inceptionPrompt = await prompt.format({
        country: "India",
    })

    // console.log(inceptionPrompt);
    /*
    +++++++++++++++++++ Pipe Concept (Connecting Model with Prompt) +++++++++++++++++++
    ✅ This is the main concept.

What is happening here? 👉 It connects the prompt template with the AI model.
*** What Does pipe() Do?
It means:

First, the prompt gets formatted.
Then the AI model receives the final question.
Finally, the model generates the answer.

---- 
Example of pipe() in Real Life:
Imagine a Pizza Order App 🍕:

Step 1: You enter your pizza type (prompt).
Step 2: The app sends the request to the chef (model).
Step 3: The chef makes the pizza and sends it back (response) - OpenAI model

    */
    const chain = prompt.pipe(model);
    /*
    ************* Invoking the Chain *************
    👉 This is where the AI model generates the answer.
    */
    const result = await chain.invoke({
        country: "India",
    });
    console.log(result.content);

};

const fromMessages = async () => {
    // ✅ This is the second way to create a prompt template.
    // Draw Back is not type safe for dynamic varible when incetionPromt and but when will give the wrong varible then it will throw runtime error.
    const prompt = ChatPromptTemplate.fromMessages([
        ["system", "What is the capital of {country}?"],
        ["user", "{country}"],

    ]);

    const inceptionPrompt = await prompt.format({
        country: "India",
    });
    const chain = prompt.pipe(model);
    const result = await chain.invoke({
        country: "India",
    });
    console.log(result.content);
};
const main = async () => {
    // await fromTemplate();
    await fromMessages();
};

main();



