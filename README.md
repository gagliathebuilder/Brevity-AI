# BrevityIQ Backend

BrevityIQ is a tool that helps users quickly digest long-form content by synthesizing articles, videos, and podcasts into concise, shareable summaries.

## Features

- User authentication using Supabase
- URL-based content summarization using GPT-4 Turbo
- Editable and shareable summaries with ownership disclaimer
- Robust error handling and basic analytics

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Supabase account and project
- OpenAI API key

## Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd brevityiq-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your credentials:
   ```
   PORT=3000
   NODE_ENV=development
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   OPENAI_API_KEY=your_openai_api_key
   ```

4. Set up your Supabase database:
   - Create a new project in Supabase
   - Create a `summaries` table with the following columns:
     - `id` (uuid, primary key)
     - `user_id` (uuid, foreign key to auth.users)
     - `url` (text)
     - `content` (text)
     - `summary` (text)
     - `created_at` (timestamp with time zone)
     - `updated_at` (timestamp with time zone)

5. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Summarization
- `POST /api/summarize` - Generate a summary from a URL
- `GET /api/summarize` - Get user's summaries

### Sharing
- `GET /api/share/:id` - Get a specific summary
- `PUT /api/share/:id` - Update a summary
- `DELETE /api/share/:id` - Delete a summary

## Development

- The project uses Express.js for the server
- Supabase for authentication and data storage
- OpenAI's GPT-4 Turbo for content summarization
- Environment variables for configuration
- Error handling middleware for consistent error responses

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

ISC 