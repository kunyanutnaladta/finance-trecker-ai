# 💰 AI Finance Tracker

A full-stack personal finance tracking web application powered by AI analysis.

![alt text](image.png)

![alt text](image-1.png)

![alt text](image-2.png)

![Tech Stack](https://img.shields.io/badge/React-18-blue) ![Node.js](https://img.shields.io/badge/Node.js-Express-green) ![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-blue) ![AI](https://img.shields.io/badge/AI-Groq%20LLaMA-orange)


## ✨ Features

- 📊 **Dashboard** — monthly income/expense summary with charts
- ➕ **Transaction Management** — add, edit, delete income and expense records
- 🤖 **AI Analysis** — get personalized financial insights powered by Groq LLaMA
- 🔐 **Authentication** — secure JWT-based login and registration
- 📱 **Responsive Design** — glassmorphism UI that works on all screen sizes

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Recharts, Axios |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| AI | Groq API (LLaMA 3.1) |
| Auth | JWT, bcryptjs |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-username/ai-finance-tracker.git
cd ai-finance-tracker
```

2. **Setup Backend**
```bash
cd server
npm install
cp .env.example .env
```

3. **Configure environment variables** in `server/.env`
```
PORT=3001
CLIENT_URL=http://localhost:5173
JWT_SECRET=your_secret_key
DATABASE_URL=postgresql://postgres:password@localhost:5432/finance_tracker
GROQ_API_KEY=your_groq_api_key
```

4. **Create the database**
```bash
psql -U postgres -c "CREATE DATABASE finance_tracker;"
```

5. **Start the backend**
```bash
npm run dev
```

6. **Setup Frontend** (in a new terminal)
```bash
cd client
npm install
npm run dev
```

7. Open **http://localhost:5173** in your browser

## 📁 Project Structure

```
ai-finance-tracker/
├── client/                  # React frontend
│   └── src/
│       ├── api/             # Axios instance
│       ├── context/         # Auth context
│       └── pages/           # Login, Register, Dashboard
└── server/                  # Express backend
    ├── db/                  # Database schema & connection
    ├── middleware/          # JWT auth middleware
    └── routes/              # API routes
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/transactions` | Get transactions |
| POST | `/api/transactions` | Add transaction |
| PUT | `/api/transactions/:id` | Update transaction |
| DELETE | `/api/transactions/:id` | Delete transaction |
| GET | `/api/transactions/summary` | Monthly summary |
| POST | `/api/ai/analyze` | AI financial analysis |

## 🔑 Getting API Keys

- **Groq API** (free): https://console.groq.com

## 📄 License

MIT