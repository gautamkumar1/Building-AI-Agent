import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { todosTable } from './schema.js';
import { eq, ilike } from 'drizzle-orm';
import OpenAI from 'openai';
import readlineSync from 'readline-sync';
const db = drizzle(process.env.DATABASE_URL);

const createTodo = async (todo) => {
    const [result] = await db.insert(todosTable).values({todo}).returning({
        id: todosTable.id
    });
    return result.id;
}

const updateTodoById = async (id) => {
    return await db.update(todosTable).where(eq(todosTable.id,id));
}

const getAllTodos = async () => {
    return await db.select().from(todosTable);
}

const deleteTodoById = async (id) => {
    await db.delete(todosTable).where(eq(todosTable.id, id));
};

const searchTodo = async (todo) => {
    return await db
        .select()
        .from(todosTable)
        .where(ilike(todosTable.todo, `%${todo}%`)); 
};


const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const SYSTEM_PROMPT = `
You are an AI To-Do List Assistant with START, PLAN, ACTION, Obeservation and Output State.
Wait for the user prompt and first PLAN using available tools.
After Planning, Take the action with appropriate tools and wait for Observation based on Action.
Once you get the observations, Return the AI response based on START propmt and observations

You can manage tasks by adding, viewing, updating,deleting and searching tasks.

You must strictly follow the JSON output format.

Todo DB Schema:
id: Int and Primary Key
todo: String
created_at: Date Time
updated_at: Date Time

Available Tools:
- getAllTodos(): Returns all the Todos from Database
- createTodo(todo: string): Creates a new Todo in the DB and takes todos as a string and returns the ID of the created todo
- updateTodoById(id: string): Updates the todo by ID given in the DB and takes id as a string
- deleteTodoById(id: string): Deleted the todo by ID given in the DB and takes id as a string
- searchTodo (query: string): Searches for all todos matching the query in the DB and takes query as a string using ilike operator.

Example:
START
{"type":"user","user":"I want to add for shopping groceries"}
{"type":"plan":"I will try to get more context on what user needs to shop"}
{"type":"output":"can you tell me what all items you need to shop?"}
{"type":"user","user":"I want to shop for milk, bread, butter and eggs"}
{"type":"plan","plan":"I will call createTodo with todo as for shopping groceries"}
{"type":"action","function":"createTodo","input":"shopping for milk, bread, butter and eggs"} 
{"type":"observation","observation":"1"}
{"type":"output","output": "Todo added successfully"}
`
const myTools = {
    "createTodo": createTodo,
    "updateTodoById": updateTodoById,
    "getAllTodos": getAllTodos,
    "deleteTodoById": deleteTodoById,
    "searchTodo": searchTodo
}
const messages = [{role: 'system', content: SYSTEM_PROMPT}];
while(true){
    const userPrompt = readlineSync.question("Enter your prompt: ");
    const query = {
        role: 'user',
        content: userPrompt
    }
    messages.push({role: 'user', content: JSON.stringify(query)});
    while(true){
        const chat = await client.chat.completions.create({
            model:"gpt-4o",
            messages: messages,
            response_format: {type: 'json_object'}
        })
        const result = chat.choices[0].message.content;
        console.log(`---------------- START AI RESPONSE ----------------`)
        console.log(result)
        console.log(`---------------- END AI RESPONSE ----------------`);
        messages.push({role: 'assistant', content: result});
        const call = JSON.parse(result);
        if(call.type === 'output'){
            console.log(`🤖: ${call.output}`);
            break;
        }
        else if (call.type === 'action'){
            const fn = myTools[call.function]
            const observation = await fn(call.input)
            const obs = {type: 'observation', observation: observation}
            messages.push({role: 'developer', content: JSON.stringify(obs)});
        }
    }
}