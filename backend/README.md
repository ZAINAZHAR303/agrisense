# AgriSense Backend

Node.js/Express backend server for AgriSense application.

## Features

- **Authentication**: User signup, login, and JWT-based authentication
- **Social Posts**: Create, read, delete posts with likes and comments
- **Soil Monitoring**: Store and retrieve soil data (NPK, pH, moisture, temperature)
- **Fertilizer Recommendations**: AI-based fertilizer recommendations based on soil data
- **Image Upload**: Upload images to Cloudinary

## Tech Stack

- **Node.js** + **Express.js**
- **MongoDB** for database
- **JWT** for authentication
- **Cloudinary** for image storage
- **bcryptjs** for password hashing

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
MONGODB_URI_STANDARD=optional_non_srv_mongodb_uri
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FRONTEND_URL=http://localhost:3000
ALLOW_START_WITHOUT_DB=false
```

3. Start the server:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

### MongoDB DNS SRV troubleshooting

If your network blocks SRV DNS lookups (error like `querySrv ECONNREFUSED`), keep `MONGODB_URI` for Atlas and add a non-SRV URI in `MONGODB_URI_STANDARD`.

For local frontend/backend development when MongoDB is temporarily unreachable, set:

```env
ALLOW_START_WITHOUT_DB=true
```

The API will boot, but routes that require database access will return errors until MongoDB is reachable.

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Posts
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create new post (protected)
- `DELETE /api/posts/:id` - Delete post (protected)
- `POST /api/posts/like` - Like/unlike post (protected)
- `POST /api/posts/comment` - Add comment to post (protected)

### Soil Data
- `GET /api/soil-data` - Get user's soil data (protected)
- `POST /api/soil-data` - Add new soil data (protected)

### Fertilizer
- `POST /api/fertilizer/recommend` - Get fertilizer recommendation (protected)

### Upload
- `POST /api/upload` - Upload image to Cloudinary (protected)

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js       # MongoDB connection
│   │   └── cloudinary.js     # Cloudinary configuration
│   ├── middleware/
│   │   └── auth.js           # JWT authentication middleware
│   ├── routes/
│   │   ├── auth.js           # Authentication routes
│   │   ├── posts.js          # Social posts routes
│   │   ├── soilData.js       # Soil monitoring routes
│   │   ├── fertilizer.js     # Fertilizer recommendation routes
│   │   └── upload.js         # Image upload routes
│   └── server.js             # Express app & server setup
├── .env                       # Environment variables
├── .gitignore
└── package.json
```

## Development

The server runs on `http://localhost:5000` by default. All API routes are prefixed with `/api`.

Health check endpoint: `GET /health`
