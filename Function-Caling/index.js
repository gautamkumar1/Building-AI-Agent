import OpenAI from "openai";

const client = new OpenAI({
    apiKey:process.env.OPENAI_API_KEY,
})
const getCurrentDataAndTime = ()=>{
    const date = new Date();
    return date.toLocaleString();
}

const getTaskStatus = (taskId)=>{
    console.log("Task id: ",taskId);
    
    if(taskId === "1234"){
        return "completed";
    }else{
        return "pending";
    }
}
const callOpenAiWithFunctionCalling = async () =>{
    const context = [{role:"system",content:"Act like a cool bro,You are an assistant who can also give current time and date and task information."},{role:"user",content:"what is the status of this taskId 1234"}]
    const res = await client.chat.completions.create({
        model:"gpt-3.5-turbo",
        messages:context,
        tools:[{
            type:"function",
             // Configure the function calling
            function:{
                name:"getCurrentDataAndTime",
                description:"This function return the current date and time."
            },
            function:{
                name:"getTaskStatus",
                description:"This function return the status of the task.",
                parameters:{
                    type:"object",
                    properties:{
                        taskId:{
                            type:"string",
                            description:"The id of the task",
                        }
                    },
                    required:["taskId"]
                }
            }
        }],
        tool_choice:"auto"
    })
    console.log("Frist ai response: ",res.choices[0].message.content);
    // console.log(`----------------- Choice: ${JSON.stringify(res.choices)}`);
    
    const shouldInvokeFunction = res.choices[0].finish_reason === "tool_calls";
    // console.log(`Should invoke function: ${shouldInvokeFunction}`);
    
    const tool_calls = res.choices[0].message.tool_calls?.[0]
    // console.log(`Tool calls: ${JSON.stringify(tool_calls)}`);
    if(!tool_calls) return;


    if(shouldInvokeFunction){


        const functionName = tool_calls.function.name;

        // Function calling without parameter
        if(functionName === "getCurrentDataAndTime"){
            const functionResponse = getCurrentDataAndTime();
            context.push(res.choices[0].message);
            // console.log(`*************** Before pushing context: ${JSON.stringify(context)}`);
            
            context.push({
                role:"tool",
                content: functionResponse,
                tool_call_id:tool_calls.id
            })
            // console.log(`*************** After pushing context: ${JSON.stringify(context)}`);
            const finalResponse = await client.chat.completions.create({
                model:"gpt-3.5-turbo",
                messages:context,
            })
            console.log("Final response: ",finalResponse.choices[0].message.content);
        }

        // Function calling with parameter
        if(functionName === "getTaskStatus"){
            // extract parameters from tool call
            const arg = tool_calls.function.arguments;
            const parsedArg = JSON.parse(arg);
            const functionResponse = getTaskStatus(parsedArg.taskId);
            context.push(res.choices[0].message);
            
            context.push({
                role:"tool",
                content: functionResponse,
                tool_call_id:tool_calls.id
            })
            const finalResponse = await client.chat.completions.create({
                model:"gpt-3.5-turbo",
                messages:context,
            })
            console.log("Final response: ",finalResponse.choices[0].message.content);
        }


    }
}

callOpenAiWithFunctionCalling();