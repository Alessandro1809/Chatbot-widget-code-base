# AI Assistant Widget Backend

This is the backend server for the AI Assistant Widget. It provides an API endpoint for chat functionality using OpenAI's API.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file based on the `.env.example` template and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=3001
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   
   Or for production:
   ```bash
   npm start
   ```

## API Endpoints

### POST /api/chat

Processes chat messages and returns AI responses.

**Request Body:**

```json
{
  "messages": [
    { "role": "user", "content": "Hello, how can you help me?" }
  ],
  "pageContext": "Information about the current page the user is viewing"
}
```

**Response:**

```json
{
  "reply": "I'm an AI assistant here to help you with information about this page..."
}
```

## Technologies Used

- Node.js
- Express
- TypeScript
- OpenAI API