# BrevityIQ Backend

A Node.js backend service for BrevityIQ, a tool that helps users quickly digest long-form content by generating concise, shareable summaries.

## Features

- User authentication using Supabase
- URL-based content summarization using GPT-4 Turbo
- Editable and shareable summaries
- Robust error handling and rate limiting
- Secure API endpoints

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Supabase account
- OpenAI API key

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/brevityiq-backend.git
cd brevityiq-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
OPENAI_API_KEY=your_openai_api_key
PORT=3000
NODE_ENV=development
```

## Running the Application

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout user

### Health Check
- `GET /health` - Check server status

## Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Route controllers
├── middleware/     # Custom middleware
├── routes/         # API routes
├── services/       # Business logic
└── utils/          # Utility functions
```

## Error Handling

The application includes comprehensive error handling:
- Input validation
- Authentication errors
- Rate limiting
- Server errors

## Security

- Helmet.js for security headers
- Rate limiting to prevent abuse
- Environment variable protection
- Secure authentication with Supabase

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

ISC 