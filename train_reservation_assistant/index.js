/**
 * 
 * Tech features to implement:

- Function calling
- getTrainsBetweenStations(source, destination)
- bookTicket(trainName, date)
- Context
 */

import OpenAI from "openai";
import readlineSync from "readline-sync";
const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const getTrainsBetweenStations = (source, destination) => {
    if (source == "Delhi" && destination == "Mumbai") {
        return ["Shatabdi Express", "Rajdhani Express"]
    }
    else if (source == "Madhubani" && destination == "Nagpur") {
        return ["Gareeb Rath", "Swantrasanini Express"]
    }
    else {
        return ["No trains found"]
    }
}
const bookTicket = (trainName, date) => {
    if (trainName == "Shatabdi Express" && date == "2025-02-22") {
        return "9572"
    }
    else if (trainName == "Rajdhani Express" && date == "2025-03-10") {
        return "3345"
    }
    else {
        return "UNAVAILABLE"
    }
}

const trainBookingAgent = async (prompt) => {
    const Context = [{ role: "system", content: "Hello! I am Train Reservation Assistant. How can I help you?" }]
    Context.push({ role: "user", content: prompt })
    // call openai for tool selection calling
    const response = await client.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: Context,
        tools: [
            {
                type: "function",
                function: {
                    name: "getTrainsBetweenStations",
                    description: "This will return the distance between two stations in the form of array string. Example: ['Shatabdi Express', 'Rajdhani Express']",
                    parameters: {
                        type: "object",
                        properties: {
                            source: {
                                type: "string",
                                description: "Source station"
                            },
                            destination: {
                                type: "string",
                                description: "Destination station"
                            }
                        },
                    },
                    required: ["source", "destination"]
                }
            },
            {
                type: "function",
                function: {
                    name: "bookTicket",
                    description: "This will return the PNR number of train if the train is available on the given date",
                    parameters: {
                        type: "object",
                        properties: {
                            trainName: {
                                type: "string",
                                description: "Name of the train"
                            },
                            date: {
                                type: "string",
                                description: "Date of journey"
                            }
                        },
                        required: ["trainName", "date"]
                    }
                }
            }
        ]
    })
    const shouldInvoke = response.choices[0].finish_reason == "tool_calls"
    if (shouldInvoke) {
        const toolsCalls = response.choices[0].message.tool_calls?.[0];
        if (!toolsCalls) return;
        const functionName = toolsCalls.function.name;
        if (functionName == "getTrainsBetweenStations") {
            const rawArguments = toolsCalls.function.arguments;
            const { source, destination } = JSON.parse(rawArguments);
            const functionResponse = getTrainsBetweenStations(source, destination);
            Context.push(response.choices[0].message);
            Context.push({
                role: "tool",
                content: functionResponse.toString(),
                tool_call_id: toolsCalls.id,
            })
        }
        if (functionName == "bookTicket") {
            const rawArguments = toolsCalls.function.arguments;
            const { trainName, date } = JSON.parse(rawArguments);
            const functionResponse = bookTicket(trainName, date);
            Context.push(response.choices[0].message);
            Context.push({
                role: "tool",
                content: functionResponse.toString(),
                tool_call_id: toolsCalls.id,
            })
        }
        // call openai again with function calling response
        const finalResponse = await client.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages:Context,
            temperature: 0,
        });
        return finalResponse.choices[0].message.content;
    }
}

while (true) {
    const prompt = readlineSync.question("You: ");
    if (prompt.toLocaleLowerCase() == "exit"){
        console.log("Exiting...");
        break;
    }
    const response = await trainBookingAgent(prompt);
    console.log("Train Reservation Assistant: ", response);
}
