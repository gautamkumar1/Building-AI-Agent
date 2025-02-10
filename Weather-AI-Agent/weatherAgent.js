import 'dotenv/config'
import OpenAI from 'openai';
import readlineSync from 'readline-sync';
const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Tools
const getWeatherDetails = (city = "")=>{
    if(city.toLocaleLowerCase() === "noida") return "10°C";
    if(city.toLocaleLowerCase() === "delhi") return "20°C";
    if(city.toLocaleLowerCase() === "nagpur") return "15°C";
    if(city.toLocaleLowerCase() === "pune") return "18°C";
}
const myTools = {
    "getWeatherDetails": getWeatherDetails
}
const SYSTEM_PROMPT =`
You are an AI Assistant with START, PLAN, ACTION, Obeservation and Output State.
Wait for the user prompt and first PLAN using available tools.
After Planning, Take the action with appropriate tools and wait for Observation based on Action.
Once you get the observations, Return the AI response based on START propmt and observations

Strictly follow the JSON output format as in examples.

Available Tools: 
- getWeatherDetails(city:string):string
getWeatherDetails is a function that takes city name as input and returns the weather of that city.
Example:
START
{ "type": "user", "user": "what is the sum of weather of Noida and Delhi?" }
{ "type": "plan", "plan": "I will call the getWeatherDetails for Noida" }
{ "type": "action", "function": "getWeatherDetails", "input": "noida" }
{ "type": "observation", "observation": "10°C" }
{ "type": "plan", "plan": "I will call getWeatherDetails for Delhi" }
{ "type": "action", "function": "getWeatherDetails", "input": "delhi" }
{ "type": "observation", "observation": "20°C" }
{ "type": "output", "output": "The sum of weather of Noida and Delhi is 30°C"
`

const messages = [{role:"system",content:SYSTEM_PROMPT}]

while(true){
    const userPrompt = readlineSync.question("Enter your prompt: ");
    const query = {
        role:"user",
        content:userPrompt
    }
    messages.push({role:"user",content:JSON.stringify(query)})

    while(true){
            const chat = await client.chat.completions.create({
                model:"gpt-4o",
                messages:messages,
                response_format: {type:'json_object'}
            })
            const result = chat.choices[0].message.content;
            console.log(`---------------- START AI RESPONSE ----------------`)
            console.log(result)
            console.log(`---------------- END AI RESPONSE ----------------`);
            
            messages.push({role:"assistant",content:result})
            const call = JSON.parse(result)
            if(call.type === "output"){
                console.log(`🤖: ${call.output}`);
                break;
            }
            else if (call.type === "action"){
                const fn = myTools[call.function]
                const observation = fn(call.input)
                const obs = {type:"observation",observation:observation}
                messages.push({role:"developer",content:JSON.stringify(obs)})
            }
    }
}


