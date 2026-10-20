# VoicePilot AI — Frontend

The frontend for VoicePilot AI, an AI-powered voice sales assistant built with Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, and Lucide icons.

It provides a dashboard for browser-based voice conversations, live transcripts, AI-generated sales insights, call history, and recordings.

## ✨ Features

- **Real-Time Voice Conversations:** Connects to the FastAPI backend through WebSockets and the Gemini Live API.
- **Live Transcription:** Displays conversation transcripts during voice sessions.
- **Call Controls:** Start and end voice sessions from the dashboard.
- **AI-Powered Insights:** View summaries, customer requirements, objections, sentiment, and recommended next steps when available.
- **Call History:** Review previous calls and their associated details.
- **Recording Playback:** Play saved recordings when available.
- **Sales Status Tracking:** View classifications such as Interested, Converted, Follow-up Required, Not Interested, Demo Requested, and No Response.
- **Responsive Dashboard:** Navigate dashboard metrics, call details, analytics, and settings.

> **Note:** Voice sessions use the browser microphone and Gemini Live through the backend. The application does not place real telephone calls. Recording is available when consent is provided and the recording is successfully saved.

## 🛠️ Tech Stack

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide icons
- FastAPI backend integration
- WebSockets for real-time voice communication
- Google Gemini API integration through the backend

## ⚙️ Prerequisites

Before running the frontend, ensure you have:

- Node.js installed
- npm installed
- The VoicePilot AI backend configured and running
- An active internet connection
- A modern browser with microphone access

## 🚀 Setup

### 1. Navigate to the Frontend Directory

From the project root, run:

    cd frontend

### 2. Install Dependencies

    npm install

### 3. Configure the Backend URL

If the frontend uses `NEXT_PUBLIC_API_URL`, create a `.env.local` file inside the `frontend/` directory:

    NEXT_PUBLIC_API_URL=http://127.0.0.1:8000

This is the local development URL for the FastAPI backend. Use the environment variable name expected by the frontend code.

### 4. Start the Development Server

    npm run dev

Open the frontend in your browser:

[http://localhost:3000](http://localhost:3000)

Make sure the backend is also running before testing voice sessions, call history, AI analysis, or recording playback.

## 🔗 Connecting the FastAPI Backend

The frontend communicates with the backend through HTTP API requests and WebSockets.

### Backend Configuration

1. Start the FastAPI backend.
2. Configure `NEXT_PUBLIC_API_URL` in `.env.local` if required by the frontend.
3. Ensure the backend's CORS configuration allows requests from `http://localhost:3000`.
4. Verify that the API endpoint paths in `lib/api/calls.ts` match the backend routes.
5. Test the backend health endpoint at [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health).
6. Allow microphone access in the browser before starting a voice session.

### Example CORS Configuration

Add the following configuration to the FastAPI application if CORS is not already configured. Adapt it to the existing application rather than adding duplicate middleware.

    from fastapi.middleware.cors import CORSMiddleware

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

For production deployment, configure the actual frontend origin and use secure deployment settings.

**Security:** Gemini API keys and any future telephony, speech-to-text, or language-model provider credentials must remain on the backend. Never expose secrets through `NEXT_PUBLIC_*` environment variables.

## 📁 Project Structure

    frontend/
    ├── app/                     # App Router pages, layout, and global styles
    ├── components/
    │   ├── layout/              # Sidebar and top navigation
    │   ├── dashboard/           # Dashboard metric cards
    │   ├── call/                # Call controls, voice orb, transcript, AI insights
    │   ├── calls/               # Call history, details, and recording player
    │   └── sections/             # Analytics and settings pages
    ├── hooks/
    │   ├── use-call-session.ts  # Voice session state and lifecycle
    |   ├── use-live-session.ts  # Live voice session handling
    │   ├── use-microphone.ts    # Microphone permissions and audio stream
    │   └── use-audio-level.ts   # Microphone audio-level visualization
    ├── lib/
    │   ├── api/
    │   │   ├── client.ts        # API client and error handling
    │   │   └── calls.ts         # Typed call-related API functions
    │   ├── demo/                # Demo data or simulation utilities, if retained
    │   └── types.ts             # Shared TypeScript types
    └── ...

The exact files and directories may vary with the current implementation.

## 🔌 Backend Integration

The API client handles communication with the backend and reports request failures through error states or notifications.

The frontend can integrate with backend functionality for:

- Retrieving call history
- Fetching individual call details
- Saving call information and transcripts
- Requesting AI-generated call analysis
- Uploading and retrieving recordings
- Establishing real-time voice sessions through WebSockets

If the backend is unreachable, dependent features may display an error instead of loading live data.

## 🔒 Privacy and Security

- Obtain consent before recording conversations.
- Keep API keys and provider credentials on the backend.
- Do not commit `.env.local` or other environment files.
- Use HTTPS in production so browser microphone access and network communication are appropriately secured.
- Configure CORS to allow only trusted frontend origins in production.
- Handle customer information, transcripts, and recordings responsibly.

## ⚠️ Limitations

- The application uses browser-based voice conversations and does not place real telephone calls.
- Live voice features require a running backend and valid Gemini API access.
- Call analysis depends on the backend and the configured AI service.
- Recording playback is available only when a recording has been successfully saved.
- Some dashboard metrics or sample records may be illustrative if the implementation explicitly uses demo data.

## 🔮 Future Improvements

- Integration with telephony providers for real outbound calls
- Enhanced live transcript and audio controls
- Additional language support
- CRM integration
- Improved call analytics and reporting
- Authentication and role-based access control
- Production deployment and monitoring
- Expanded automated testing

## 👩‍💻 Project Information

| Field | Details |
|---|---|
| Project Name | VoicePilot AI |
| Component | Frontend Dashboard |
| Framework | Next.js |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Backend Integration | FastAPI |
| AI Integration | Google Gemini through the backend |

---

**VoicePilot AI — Making AI-powered sales conversations smarter.** 🎙️

