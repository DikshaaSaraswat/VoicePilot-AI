
# VoicePilot AI 🎙️

### AI-Powered Voice Sales Assistant for TaskFlow AI

VoicePilot AI is an AI-powered voice sales assistant designed to conduct real-time conversations with potential customers, capture conversation transcripts, record calls with consent, and generate actionable sales insights using AI.

The application combines real-time voice interaction, automated conversation analysis, sales status classification, and call history management in one dashboard.

---

## ✨ Features

- **Real-Time Voice Conversations:** Interact with an AI sales assistant through the browser microphone using the Gemini Live API.
- **Multilingual Conversations:** Supports English and Hindi conversations.
- **Live Transcription:** Captures and displays conversation transcripts during voice sessions.
- **Call Controls:** Start and end voice sessions directly from the dashboard.
- **Consent-Based Recording:** Records conversations when recording consent is enabled.
- **Recording Playback:** Play back saved recordings for supported calls.
- **AI-Powered Call Analysis:** Generates conversation summaries, customer requirements, objections, sentiment, and recommended next steps.
- **Sales Status Classification:** Classifies calls into six categories:
  - Converted
  - Interested
  - Follow-up Required
  - Not Interested
  - Demo Requested
  - No Response
- **Call History:** Review previous calls, transcripts, analysis results, and recording availability.
- **Local Data Storage:** Uses SQLite for call records and local file storage for audio recordings.

---

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| Programming Language | Python |
| Backend Framework | FastAPI |
| Frontend Framework | Next.js |
| UI Library | React |
| Frontend Language | TypeScript |
| Styling | Tailwind CSS |
| AI Integration | Google Gemini API, Gemini Live API |
| Database | SQLite |
| Real-Time Communication | WebSockets |
| Audio Recording | Browser MediaRecorder API |

---

## 📁 Project Structure

    VoicePilot-AI/
    ├── backend/
    │   ├── main.py
    │   ├── voice_session.py
    │   ├── gemini_live.py
    │   ├── call_analysis.py
    │   ├── requirements.txt
    │   └── ...
    ├── frontend/
    │   ├── app/
    │   ├── components/
    │   ├── hooks/
    │   ├── lib/
    │   └── ...
    ├── .gitignore
    └── README.md

**Note:** Environment files, virtual environments, local databases, recordings, and generated files are excluded from Git version control.

---

## ⚙️ Prerequisites

Before running the application, ensure you have:

- Python installed
- Node.js and npm installed
- A Google Gemini API key with access to the models used by the application
- A modern browser with microphone access
- An active internet connection

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/DikshaaSaraswat/VoicePilot-AI.git
cd VoicePilot-AI
```

### 2. Set Up the Backend

Navigate to the backend directory:

```bash
cd backend
```

Create and activate a Python virtual environment on Windows.

**For PowerShell:**

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

If PowerShell blocks activation, use Command Prompt:

```bat
venv\Scripts\activate.bat
```

Install the backend dependencies:

```bash
python -m pip install -r requirements.txt
```

Create a `.env` file inside the `backend/` directory and add your Gemini API key:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Replace the placeholder with your own API key. Never publish your actual API key or commit your `.env` file to GitHub.

Start the backend server:

```bash
python -m uvicorn main:app --reload
```

The backend will be available at:

- **API:** [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Health Check:** [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)
- **Interactive API Documentation:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 3. Set Up the Frontend

Open a second terminal from the project root and navigate to the frontend:

```bash
cd frontend
```

Install the frontend dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the application in your browser:

[http://localhost:3000](http://localhost:3000)

If the frontend requires a backend API URL, configure the environment variable expected by the existing frontend code.

### 4. Start a Voice Session

1. Start both the backend and frontend servers.
2. Open VoicePilot AI in your browser.
3. Allow microphone access when prompted.
4. Enter the required customer and product details.
5. Enable recording consent if you want the conversation recorded.
6. Start a voice session and speak with the AI assistant.
7. End the session to save the call.
8. Review the transcript, recording availability, and AI-generated analysis in the dashboard.

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Returns a basic API response |
| GET | `/health` | Checks backend health |
| GET | `/api/calls` | Retrieves call history |
| GET | `/api/calls/{call_id}` | Retrieves an individual call |
| POST | `/api/calls/logs` | Saves call details and transcript |
| PATCH | `/api/calls/{call_id}` | Updates call information |
| POST | `/api/calls/{call_id}/analyze` | Generates AI-powered call analysis |
| POST | `/api/calls/{call_id}/recording` | Uploads a call recording |
| GET | `/api/calls/{call_id}/recording` | Retrieves a saved recording |
| WebSocket | `/ws/voice` | Handles real-time voice sessions |

---

## 🧠 AI-Powered Call Analysis

VoicePilot AI uses Google's Gemini models to analyze conversation transcripts and generate structured sales insights.

### Analysis Includes

- **Summary:** A concise overview of the conversation.
- **Customer Requirements:** The customer's needs and expectations.
- **Objections:** Concerns or barriers raised during the conversation.
- **Sentiment:** An assessment of the customer's tone and sentiment.
- **Sentiment Score:** A numerical sentiment score.
- **Next Steps:** Recommended actions for the sales representative.
- **Follow-Up Date:** A suggested or identified follow-up date, when available.
- **Sales Status:** A classification based on the available conversation evidence.

### Supported Sales Statuses

| Status | Description |
|---|---|
| Converted | The customer has agreed to proceed with the product or service. |
| Interested | The customer has expressed interest in the product. |
| Follow-up Required | Further communication is needed. |
| Not Interested | The customer has declined or expressed no interest. |
| Demo Requested | The customer has requested a product demonstration. |
| No Response | The customer has not provided a meaningful response. |

AI-generated insights are intended to assist sales representatives and should be reviewed when necessary.

---

## 📞 Call History and Recordings

VoicePilot AI stores call details and makes previous conversations available through the dashboard.

Call history may include:

- Customer and product information
- Call date and duration
- Conversation transcript
- Sales status
- AI-generated summary and analysis
- Recording availability and playback

Call records are stored in a local SQLite database, while recordings are stored in `backend/recordings/`.

Calls created before recording support was implemented may not have an associated recording.

---

## 🔒 Privacy and Security

- Audio recording is enabled only when recording consent is provided.
- Appropriate consent should be obtained before recording conversations.
- API keys must be stored securely and never committed to the repository.
- Customer information and audio recordings should be handled securely.
- Local database files, recordings, virtual environments, and generated files should be excluded from Git version control.

---

## ⚠️ Limitations

- The current implementation uses browser-based voice conversations and does not place real telephone calls.
- An active internet connection and valid Gemini API access are required.
- AI-generated summaries, sentiment scores, and sales classifications may not always be accurate.
- Recording playback is available only when a recording has been successfully saved.
- The current implementation uses local SQLite and file-based recording storage.
- Production deployment requires suitable persistent storage, secure configuration, and additional testing.

---

## 🔮 Future Improvements

- Integration with telephony providers for real outbound calls
- Support for additional languages and regional languages
- Expanded testing of sales status classification
- CRM integration
- Automated follow-up reminders
- User authentication and role-based access control
- Cloud database integration
- Persistent cloud recording storage
- Production deployment and monitoring
- Improved error handling and analytics

---

## 👩‍💻 Project Information

| Field | Details |
|---|---|
| Project Name | VoicePilot AI |
| Product | TaskFlow AI |
| Project Type | AI Voice Sales Assistant |
| Backend | Python and FastAPI |
| Frontend | Next.js, React, TypeScript, and Tailwind CSS |
| AI Integration | Google Gemini and Gemini Live |

---

**VoicePilot AI — Making AI-powered sales conversations smarter.** 🎙️
