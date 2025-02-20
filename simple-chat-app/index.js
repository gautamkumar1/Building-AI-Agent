import OpenAI from 'openai';
import readlineSync from 'readline-sync';
import { encoding_for_model } from 'tiktoken';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const encoder = encoding_for_model("gpt-3.5-turbo");
const MAX_TOKENS = 200;
const context = [{role:"system", content:"You are a helpful assistant."}];

const getContextLength = () => {
    let length = 0;
    context.forEach((message) => {
        try {
            if (typeof message.content === "string") {
                length += encoder.encode(message.content).length;
            }
            else if (Array.isArray(message.content)) {
                message.content.forEach((content) => {
                    if (content?.type === "text" && content?.text) {
                        length += encoder.encode(content.text).length;
                    }
                });
            }
            // Handle function calls or other content types if needed
        } catch (error) {
            console.warn('Error calculating message length:', error);
        }
    });
    return length;
}
const removeOlderTokens = () => {
    let contextLength = getContextLength();
    while (contextLength > MAX_TOKENS) {
      for (let i = 0; i < context.length; i++) {
        const message = context[i];
        if (message.role !== "system") {
          context.splice(i, 1);
          contextLength = getContextLength();
          console.log("Updated context length: ", contextLength);
          break;
        }
      }
    }
  };
const generateLLMResponse = async (prompt) =>{
    context.push({role:"user", content:prompt});
    console.log(`context length: ${JSON.stringify(context)}`);
   // Check if adding the new prompt exceeds the limit and remove older tokens first
   if (getContextLength() > MAX_TOKENS) {
    console.log("⚠️ Context too long before request! Removing older tokens...");
    removeOlderTokens();
}
    const res = await client.chat.completions.create({
        model:"gpt-3.5-turbo",
        messages: context,
    })
    console.log(`API Response Token Usage: ${res.usage.total_tokens}`);

    // Now check again if the response pushed the token usage over the limit
    if (res.usage.total_tokens > MAX_TOKENS) {
        console.log("⚠️ Response exceeded token limit! Removing older tokens...");
        removeOlderTokens();
    }
    const resMessage = res.choices[0].message;
    context.push(resMessage);
    return res.choices[0].message.content;
}

while (true) {
    const prompt = readlineSync.question('User: ');
    if (prompt.toLowerCase() === 'exit') {
        console.log('🤖: Goodbye!');
        break;
    }
    const response = await generateLLMResponse(prompt);
    console.log(`🤖: ${response}`);
}

