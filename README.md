# InsightBoard Backend - Dependency Engine API

AI-powered backend service that converts meeting transcripts into structured dependency graphs with cycle detection.

## 🌐 Live Demo

- **API**: Coming soon (deploying to Render)
- **Frontend**: https://github.com/KirtiGauravMishra/InsightBoard_Frontend

## 🎯 Features Implemented

### ✅ Level 1 (Required)
- **Robust API** with strict output schema
- **Dependency Validation** - removes invalid task IDs
- **Cycle Detection** - DFS algorithm with 3-color system
- **Data Persistence** - MongoDB with Mongoose
- **Error Handling** - graceful failures with detailed messages

### ✅ Level 2 (Bonus)
- **Async Processing** - handles slow LLM responses with job IDs
- **Status Polling** - `/api/jobs/:jobId` endpoint for real-time status
- **Idempotency** - SHA-256 hashing prevents duplicate processing
- **Job Management** - list all jobs and check status

### ✅ Level 3 (Bonus)
- **Task Completion API** - mark tasks as complete
- **Dependency Updates** - automatically unlocks dependent tasks
- **Error States** - tracks cyclic tasks separately

## 🧠 Algorithms Used

### DFS Cycle Detection
```javascript
// 3-Color System:
// WHITE: Not visited
// GRAY: Currently exploring (in path)
// BLACK: Fully explored

function detectCycles(tasks) {
  if (colors[taskId] === 'GRAY') {
    // Found a node in current path → CYCLE!
    return true;
  }
  // ... explore dependencies
}
```

### Idempotency (SHA-256)
```javascript
// Same transcript = same hash = cached result
const hash = crypto.createHash('sha256')
  .update(transcript)
  .digest('hex');
```

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB (with Mongoose)
- **LLM**: Google Gemini 2.5-flash (free tier)
- **Validation**: Custom dependency sanitization
- **Deployment**: Render.com

## 📦 API Endpoints

### Submit Transcript
```bash
POST /api/transcripts
Content-Type: application/json

{
  "transcript": "Meeting notes here..."
}

Response:
{
  "success": true,
  "jobId": "uuid-here",
  "status": "processing",
  "message": "Transcript is being processed"
}
```

### Check Job Status
```bash
GET /api/jobs/:jobId

Response:
{
  "success": true,
  "status": "completed",
  "data": {
    "tasks": [...],
    "hasCycles": false,
    "cycleDetails": []
  }
}
```

### Complete Task
```bash
PUT /api/jobs/:jobId/tasks/:taskId/complete

Response:
{
  "success": true,
  "message": "Task marked as completed",
  "unlockedTasks": ["task-3", "task-5"]
}
```

### List All Jobs
```bash
GET /api/jobs

Response:
{
  "success": true,
  "jobs": [...]
}
```

### Health Check
```bash
GET /health

Response:
{
  "status": "OK",
  "message": "InsightBoard API is running"
}
```

## 🚀 Local Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Gemini API key (free)

### Installation

```bash
# Clone repo
git clone https://github.com/KirtiGauravMishra/InsightBoard_Backend.git
cd InsightBoard_Backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Add your credentials to .env:
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/insightboard
# GEMINI_API_KEY=your-key-here

# Start server
npm start
```

Server runs on: http://localhost:5000

## 📁 Project Structure

```
backend/
├── config/
│   └── db.js              # MongoDB connection
├── models/
│   └── Transcript.js      # Mongoose schema
├── routes/
│   ├── transcripts.js     # Submit & process endpoints
│   └── jobs.js            # Status & completion endpoints
├── services/
│   └── llmService.js      # Gemini AI integration
├── utils/
│   └── taskValidator.js   # DFS cycle detection & validation
├── server.js              # Express app entry point
└── package.json
```

## 🔑 Environment Variables

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/insightboard
GEMINI_API_KEY=your-gemini-api-key
NODE_ENV=development
```

Get free Gemini API key: https://makersuite.google.com/app/apikey

## 🧪 Testing

```bash
# Test health endpoint
curl http://localhost:5000/health

# Submit sample transcript
curl -X POST http://localhost:5000/api/transcripts \
  -H "Content-Type: application/json" \
  -d '{"transcript": "We need to setup database, then create APIs, then build UI"}'

# Check job status (use jobId from above)
curl http://localhost:5000/api/jobs/your-job-id-here
```

## 🐛 Troubleshooting

**MongoDB connection error:**
- Verify `MONGODB_URI` is correct
- Check MongoDB is running (local) or accessible (Atlas)
- Whitelist IP in MongoDB Atlas

**Gemini API error:**
- Verify `GEMINI_API_KEY` is valid
- Check free tier limits (1500 requests/day)

**Port already in use:**
- Change `PORT` in `.env`
- Or kill process: `lsof -ti:5000 | xargs kill -9` (Mac/Linux)

## 📝 Assignment Details

**Level Completed**: Level 3 (All bonuses implemented)

**Key Highlights**:
1. **DFS Cycle Detection**: Detects circular dependencies using graph coloring
2. **Idempotency**: SHA-256 hashing prevents duplicate AI calls
3. **Async Processing**: Background job processing with status polling
4. **Task Completion**: API to mark tasks complete and unlock dependencies

## 📄 License

MIT

## 👤 Author

Kirti Gaurav Mishra
- GitHub: [@KirtiGauravMishra](https://github.com/KirtiGauravMishra)
- Email: kirtigauravmishra@gmail.com

## 🔗 Related Repositories

- **Frontend**: https://github.com/KirtiGauravMishra/InsightBoard_Frontend
