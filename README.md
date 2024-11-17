# Gemini AI Client

A Node.js client for Google's Gemini AI, supporting PDF processing and interactive chat capabilities.

## Features

- PDF file processing
- Interactive chat mode (REPL)
- One-time content generation
- File upload functionality

## Installation

run `npm install`

## Usage

Start the example application:

### Different Modes

#### Chat Mode

```javascript
import GeminiClient from "./gemini-client.js";
const client = new GeminiClient();
await client.startChatREPL("./your-file.pdf");
```

#### One-time Content Generation

```javascript
const response = await client.generateContent("Analyze this data", [
  "./your-file.pdf",
]);
console.log(response);
```

@Ali Krema, NOV 2024
