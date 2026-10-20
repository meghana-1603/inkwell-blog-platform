# InkWell — Blog Platform with Comments

InkWell is a full-stack blogging platform where users can create and manage blog posts, explore stories, and interact through comments.

## Features

- User registration and login
- JWT-based authentication
- Create, view, edit, and delete blog posts
- Add comments to blog posts
- Authorization for post editing and deletion
- Search and category filtering
- Responsive user interface

## Tech Stack

**Frontend**
- React
- Vite
- JavaScript
- CSS
- Lucide React

**Backend**
- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Tokens (JWT)
- bcryptjs

## Project Structure

```text
blog-platform/
├── backend/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   └── package.json
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

- Node.js and npm
- MongoDB connection
- Git

### 1. Clone the repository

```bash
git clone https://github.com/meghana-1603/inkwell-blog-platform.git
cd inkwell-blog-platform
```

### 2. Start the backend

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` directory:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
DB_NAME=blogPlatform
JWT_SECRET=your_long_random_secret
CLIENT_URL=http://localhost:5173
```

Replace the placeholder values with your own configuration. Never commit credentials or secrets.

Start the backend:

```bash
npm run dev
```

### 3. Start the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL shown by Vite, usually `http://localhost:5173`.

## API Overview

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Log in |
| GET | `/api/auth/me` | Get the current user |
| GET | `/api/posts` | List and search posts |
| GET | `/api/posts/:id` | Get a post and its comments |
| POST | `/api/posts` | Create a post |
| PATCH | `/api/posts/:id` | Edit a post |
| DELETE | `/api/posts/:id` | Delete a post |
| POST | `/api/posts/:id/comments` | Add a comment |
| DELETE | `/api/posts/:id/comments/:commentId` | Delete an authorized comment |

Protected endpoints require valid authentication.

## Security

- Passwords are hashed before storage.
- JWT authentication protects private operations.
- Post editing and deletion are restricted by ownership.
- Environment variables and credentials must remain private.

## Author

**Meghana Dasari**

GitHub: [meghana-1603](https://github.com/meghana-1603)

---

Built as a full-stack development internship project.
