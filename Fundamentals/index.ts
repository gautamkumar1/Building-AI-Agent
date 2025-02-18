
import OpenAI from 'openai';

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

const generateLLmResponse = async (prompt:string) => {
    try {
        const response = await client.chat.completions.create({
            model:"gpt-4o",
            messages:[{role:"user",content:prompt}]
            })
        console.log(`🤖: ${response.choices[0].message.content}`);
    } catch (error) {
        console.log(error);
        
    }
}

generateLLmResponse("Describe what is nodejs in 20 words");