import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import fs from "fs";
import readline from "readline";

const instructions = `Convert unstructured user input into structured JSON, using the user's message and an uploaded file to create a comprehensive, incremental representation of the user's farm data.

You will receive two inputs:
1. User message: A text description of what the user wants done.
2. Uploaded file: Contains detailed information about the farm's plots and crop data. 

The objective is to process the information from all two sources to effectively construct JSON data describing the farm's plots and crops.

# Steps
- **Analyze User Message**: Understand the user's instructions or additional notes related to data conversion.
- **Extract Information from the Uploaded File**: Process the uploaded file to extract any plot and crop data, using explicit notes or content to understand the context.
- **Integrate New Data**: Combine insights from the user's message and the uploaded file to convert the new information into a well-structured JSON format, while appending it incrementally to the pre-existing JSON.

# Output Format
The expected output should be only in this JSON format:

{ "response": string, 
"data": [{
   "crop": string,
   "cropVariety": string,
   "area": number,
   "plot": string,
   "plotType": string,
   "areaUnit": string
}]}

"response" refers to the answer in natural language that you choose to provide for the user
"crop" is the name of the crop
"area" is the area of the plot
"plot" is the name/number of the plot

If the attached files do not include any/all of these fields, DO NOT MAKE UP ANY OTHER FIELDS. MAP WHATEVER YOU FIND TO ONLY THESE FIELDS

# Notes
- In case of conflicts (e.g., if data in the file contradicts the current JSON state), prioritize appending new data rather than modifying existing data.
- Retain all existing fields in the current JSON as they are, adding new fields or expanding existing arrays as necessary.
- Ensure that the new information fits logically into the structure, using nested objects or arrays where appropriate.
- For any data not mentioned explicitly but present in the file, infer logical fields and labels to represent it effectively.
- Output specifically in JSON structure with no code blocks, comments, or additional text.
- Expect any number of entries to parse from 1 to 250. You need to parse everything. Do not skip a single line of relevant data`;

const API_KEY = "YOUR_API_KEY"; //TODO: replace with your own API key

// Utility Functions
function fileToGenerativePart(path, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(path)).toString("base64"),
      mimeType,
    },
  };
}

class GeminiClient {
  constructor() {
    this.genAI = new GoogleGenerativeAI(API_KEY);
    this.fileManager = new GoogleAIFileManager(API_KEY);
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: instructions,
    });
  }

  // One-time content generation
  async generateContent(prompt, filePaths = []) {
    const parts = [{ text: prompt }];

    for (const path of filePaths) {
      const filePart = fileToGenerativePart(path, "application/pdf");
      parts.push(filePart);
    }

    const result = await this.model.generateContent(parts);
    return result.response.text();
  }

  // File upload functionality
  async uploadFile(filePath, options = {}) {
    const defaultOptions = {
      mimeType: "application/pdf",
      displayName: "Uploaded File",
    };

    const uploadResponse = await this.fileManager.uploadFile(filePath, {
      ...defaultOptions,
      ...options,
    });

    return uploadResponse;
  }

  // Chat functionality
  async initializeChat(filePath) {
    const filePart = fileToGenerativePart(filePath, "application/pdf");
    const chat = this.model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: instructions }],
        },
        {
          role: "user",
          parts: [{ text: "Here is my farm data" }, filePart],
        },
      ],
    });
    return chat;
  }

  async startChatREPL(filePath) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const chat = await this.initializeChat(filePath);
    console.log("\nChat initialized with PDF. Ready for questions.\n");

    while (true) {
      try {
        const userMessage = await new Promise((resolve) => {
          rl.question('Enter your message (or "exit" to quit): ', resolve);
        });

        if (userMessage.toLowerCase() === "exit") {
          rl.close();
          break;
        }

        const result = await chat.sendMessage([{ text: userMessage }]);
        console.log("\nResponse:", result.response.text(), "\n");
      } catch (error) {
        console.error("Error:", error.message);
      }
    }
  }
}

export default GeminiClient;
