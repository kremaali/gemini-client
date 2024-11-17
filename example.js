import GeminiClient from "./gemini-client.js";

const client = new GeminiClient();

// Example 1: One-time content generation
async function generateExample() {
  const response = await client.generateContent("Analyze this farm data", [
    "./farm-data.pdf",
  ]);
  console.log(response);
}

// Example 2: File upload
async function uploadExample() {
  const upload = await client.uploadFile("./farm-data.pdf", {
    displayName: "Farm Data 2024",
  });
  console.log(upload);
}

// Example 3: Interactive chat
async function chatExample() {
  await client.startChatREPL("./test.pdf"); //ensure you have a valid plot-crop farm data pdf
}

// Choose which example to run
chatExample().catch(console.error);
