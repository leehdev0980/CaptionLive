# CaptionLive

> Real-time AI-powered speech captioning for live sessions.

**CaptionLive** is a web-based real-time captioning platform that converts spoken audio into text and delivers generated captions to connected participants during a live session.

The system combines a modern web frontend, an ASP.NET Core backend, real-time communication through SignalR, PostgreSQL persistence, and a dedicated Python speech-to-text microservice powered by `faster-whisper`.


---

## Overview

CaptionLive is designed around a simple workflow:

1. A session is created.
2. A speaker records audio through the browser.
3. Audio is captured in chunks by the frontend.
4. The audio is sent to the ASP.NET Core backend.
5. The backend forwards the audio to the Python speech-to-text service.
6. The Python service decodes the browser audio using FFmpeg and transcribes it using `faster-whisper`.
7. The resulting transcription is returned to the backend.
8. The caption is persisted in PostgreSQL.
9. SignalR broadcasts the saved caption to participants connected to the corresponding session.
10. Participants can view the captions in real time and retrieve previously stored captions.

This architecture separates the user interface, application/business logic, and speech-processing workload into distinct components.

---

## Problem Statement

Live spoken communication can be difficult to follow when participants cannot reliably hear or process the speaker's audio in real time.

Traditional transcription workflows often require users to manually record audio, upload it, and wait for a transcription to be generated. This introduces a delay between the spoken content and the availability of the text.

CaptionLive addresses this problem by combining browser-based audio capture, AI-powered speech recognition, persistent session storage, and real-time communication so that transcribed speech can be delivered to connected participants while a session is taking place.

---

## Solution

CaptionLive provides a session-based environment where spoken audio can be captured and processed continuously.

Instead of treating transcription as a single large file-processing task, the application sends smaller audio segments through the system. This allows the backend to process incoming speech and distribute resulting captions to participants through a SignalR connection.

The system is divided into three primary layers:

```text
┌──────────────────────────────────────────────┐
│              CaptionLive Frontend            │
│       React + TanStack + Vite + Tailwind     │
│                                              │
│  Session UI • Audio Recording • Captions     │
│  Dashboard • Session Library • Joining       │
└───────────────────────┬──────────────────────┘
                        │
                 HTTP / SignalR
                        │
                        ▼
┌──────────────────────────────────────────────┐
│              ASP.NET Core Backend            │
│                                              │
│  REST API • SignalR • Session Management     │
│  Caption Persistence • Audience Codes        │
│  Team Invitations • Whisper Client           │
└───────────────┬──────────────────┬───────────┘
                │                  │
                │ HTTP             │ EF Core
                ▼                  ▼
┌────────────────────────┐   ┌─────────────────┐
│ Python STT Microservice│   │   PostgreSQL     │
│                        │   │                 │
│ Flask                  │   │ Sessions        │
│ faster-whisper         │   │ Captions        │
│ FFmpeg                 │   │ Audience Codes  │
│                        │   │ Invitations     │
└────────────────────────┘   └─────────────────┘
```

---

## Key Features

### 🎙️ Real-Time Audio Capture

The frontend includes a dedicated audio recording component that captures microphone input through the browser's media recording capabilities.

Audio is sent to the backend for processing rather than requiring the user to manually upload a completed recording.

### 🤖 AI Speech-to-Text

CaptionLive uses `faster-whisper` for speech recognition.

The current speech-to-text service loads the Whisper `tiny` model using CPU execution with `int8` computation.

The processing pipeline is:

```text
Browser Audio
     │
     ▼
WebM / Opus Audio
     │
     ▼
ASP.NET Core API
     │
     ▼
Python STT Service
     │
     ▼
FFmpeg
     │
     ▼
16 kHz Mono WAV
     │
     ▼
faster-whisper
     │
     ▼
English Transcription
```

### ⚡ Real-Time Caption Distribution

Generated captions are broadcast using ASP.NET Core SignalR.

Participants join a SignalR group associated with a specific session. When a caption is successfully processed and stored, the backend sends a `ReceiveCaption` event to clients in that session group.

This avoids requiring participants to repeatedly refresh or poll the application for new captions.

### 🗂️ Session Management

The backend supports creating, retrieving, updating, and ending sessions.

Sessions maintain:

* Session ID
* Title
* Start time
* End time
* Associated captions
* Caption count

The application also supports retrieving the stored captions belonging to a particular session.

### 🔐 Audience Join Codes

CaptionLive provides session-specific audience codes.

Codes can have:

* A role
* An expiration time
* A maximum number of uses
* A revoked state
* A usage count

The SignalR hub validates audience codes before allowing a participant to join a session group.

### 👥 Team Invitations

The backend contains a team invitation workflow that allows an email address and role to be associated with a session through an invitation code.

Invitation codes support:

* Expiration
* Roles
* Acceptance tracking
* Revocation state

### 📚 Caption Persistence

Generated captions are stored in PostgreSQL rather than existing only in the browser session.

Each caption contains information such as:

* Caption ID
* Session ID
* Timestamp
* Language
* Text
* Confidence
* Speaker ID

The database also indexes captions by session and timestamp to support ordered retrieval.

---

## System Architecture

CaptionLive follows a service-oriented architecture in which each major responsibility is separated into an appropriate component.

### Frontend

The frontend is located under:

```text
frontend/new_src/
```

It is built around React, Vite, TanStack Router, TanStack Query, Tailwind CSS, Radix UI components, and SignalR.

The repository contains route-based workflows for:

* Landing page
* Authentication
* Dashboard
* New session creation
* Session library
* Session details
* Session joining
* Team management
* Team invitations
* Settings
* Pricing

### Backend

The backend is located under:

```text
backend/CaptionBackend/
```

It is an ASP.NET Core 8 application responsible for:

* REST APIs
* Session management
* Caption persistence
* Audio processing orchestration
* SignalR communication
* Audience codes
* Team invitations
* PostgreSQL access
* Communication with the Python transcription service

The project targets `.NET 8` and uses Entity Framework Core with the PostgreSQL provider.

### Speech-to-Text Microservice

The Python service is located under:

```text
python-microservice/
```

It contains:

```text
app.py
stt.py
test_ping.py
create_test_webm.py
```

The service exposes a Flask API and listens on port `5001` by default.

---

## How CaptionLive Works

### 1. Session Creation

A user creates a session through the frontend.

The backend creates a session record containing a unique session ID, title, and start time.

### 2. Audio Capture

The browser captures microphone audio using the frontend's recording functionality.

The recorded data is sent to:

```text
POST /api/audio/upload
```

The endpoint accepts audio together with an optional session ID and session title.

### 3. Audio Forwarding

The ASP.NET Core backend receives the uploaded audio and forwards the raw bytes to the Python transcription service.

The backend's `WhisperClient` communicates with:

```text
POST /process
```

on the Python service.

### 4. Audio Decoding

Browser MediaRecorder data can arrive as WebM/Opus data.

The Python service uses FFmpeg to convert the incoming audio into:

```text
16 kHz
Mono
PCM signed 16-bit WAV
```

This produces an input format suitable for the Whisper model.

### 5. Speech Recognition

The service runs:

```text
faster-whisper
```

using the `tiny` Whisper model with CPU execution and `int8` computation.

The current implementation explicitly transcribes the audio as English.

### 6. Caption Persistence

The resulting transcription is passed back to the ASP.NET Core backend.

The backend stores the caption against the relevant session in PostgreSQL.

### 7. Real-Time Distribution

After the caption has been saved, the backend broadcasts it to the SignalR group associated with the session:

```text
session:{sessionId}
```

Connected clients receive the `ReceiveCaption` event.

### 8. Historical Retrieval

Previously generated captions can be retrieved through:

```text
GET /api/sessions/{sessionId}/captions
```

This makes it possible to reconstruct the caption history of a completed or ongoing session.

---

## Technology Stack

| Layer               | Technology            | Purpose                           |
| ------------------- | --------------------- | --------------------------------- |
| Frontend            | React                 | User interface                    |
| Frontend tooling    | Vite                  | Development and production builds |
| Routing             | TanStack Router       | File-based application routing    |
| Data fetching       | TanStack Query        | Server-state management           |
| UI                  | Tailwind CSS          | Styling                           |
| UI components       | Radix UI              | Accessible interface primitives   |
| Real-time client    | Microsoft SignalR     | Receiving live captions           |
| Backend             | ASP.NET Core 8        | REST API and application logic    |
| Real-time backend   | SignalR               | Session-based live communication  |
| ORM                 | Entity Framework Core | Database access                   |
| Database            | PostgreSQL            | Persistent application data       |
| API documentation   | Swagger / OpenAPI     | Backend API exploration           |
| Speech service      | Python / Flask        | Speech-processing API             |
| Speech recognition  | faster-whisper        | AI transcription                  |
| Audio processing    | FFmpeg                | WebM/Opus → WAV conversion        |
| Frontend deployment | Vercel                | Web application hosting           |

The frontend dependencies and backend project configuration confirm the major framework and library choices.

---

## Project Structure

```text
CaptionLive/
│
├── frontend/
│   └── new_src/
│       ├── src/
│       │   ├── assets/
│       │   ├── components/
│       │   ├── hooks/
│       │   ├── lib/
│       │   ├── routes/
│       │   ├── services/
│       │   ├── main_new_src.jsx
│       │   ├── router.tsx
│       │   └── styles.css
│       ├── package.json
│       ├── vite.config.ts
│       ├── tsconfig.json
│       └── vercel.json
│
├── backend/
│   └── CaptionBackend/
│       ├── Controllers/
│       ├── Data/
│       ├── Hubs/
│       ├── Migrations/
│       ├── Models/
│       ├── Properties/
│       ├── Services/
│       ├── CaptionBackend.csproj
│       ├── Program.cs
│       └── appsettings.json
│
└── python-microservice/
    ├── app.py
    ├── stt.py
    ├── create_test_webm.py
    ├── test_ping.py
    └── test.webm
```

---

## Backend API

### Sessions

| Method  | Endpoint                             | Description                 |
| ------- | ------------------------------------ | --------------------------- |
| `GET`   | `/api/sessions`                      | Retrieve recent sessions    |
| `GET`   | `/api/sessions/{sessionId}`          | Retrieve a specific session |
| `POST`  | `/api/sessions`                      | Create a session            |
| `PATCH` | `/api/sessions/{sessionId}`          | Update session information  |
| `PATCH` | `/api/sessions/{sessionId}/end`      | End a session               |
| `GET`   | `/api/sessions/{sessionId}/captions` | Retrieve session captions   |

### Audio

| Method | Endpoint            | Description                             |
| ------ | ------------------- | --------------------------------------- |
| `POST` | `/api/audio/upload` | Upload an audio chunk for transcription |

The backend forwards the audio to the Python speech-to-text service and broadcasts a successfully persisted caption through SignalR.

### Audience Codes

| Method | Endpoint                                      | Description                    |
| ------ | --------------------------------------------- | ------------------------------ |
| `POST` | `/api/audience-codes/generate?sessionId={id}` | Generate an audience join code |
| `GET`  | `/api/audience-codes/validate/{code}`         | Validate an audience code      |
| `POST` | `/api/audience-codes/join/{code}`             | Join a session using a code    |

### Team Invitations

| Method | Endpoint                     | Description              |
| ------ | ---------------------------- | ------------------------ |
| `POST` | `/api/invites`               | Create a team invitation |
| `POST` | `/api/invites/accept/{code}` | Accept an invitation     |

---

## SignalR

The backend exposes the SignalR hub at:

```text
/captionHub
```

Clients can join a session using:

```text
JoinSession(sessionId, audienceCode)
```

and leave using:

```text
LeaveSession(sessionId)
```

Sessions are represented as SignalR groups using the pattern:

```text
session:{sessionId}
```

When a new caption is persisted, clients in the corresponding group receive:

```text
ReceiveCaption
```

---

## Database

CaptionLive uses **PostgreSQL** with **Entity Framework Core**.

The backend defines the following primary database entities:

```text
Session
   │
   └── Caption

Session
   ├── AudienceJoinCode
   └── TeamMemberInvite
```

The database context currently exposes:

* `Sessions`
* `Captions`
* `AudienceJoinCodes`
* `TeamMemberInvites`

Sessions have a one-to-many relationship with captions, while audience codes and team invitations are associated with sessions.

---

## Speech-to-Text Service

The Python microservice provides two primary endpoints.

### Health Check

```http
GET /ping
```

Returns:

```json
{
  "status": "ok"
}
```

### Transcription

```http
POST /process
```

The endpoint accepts raw audio bytes and returns transcription information.

A successful response contains an English transcription and processing time:

```json
{
  "english": "Example transcription",
  "processing_time_seconds": 1.23
}
```

The implementation also handles empty or invalid audio segments without crashing the service.

---

## Configuration

The backend expects a PostgreSQL connection string named:

```text
CaptionDatabase
```

The Whisper service configuration is currently structured as:

```json
{
  "Whisper": {
    "BaseUrl": "http://localhost:5001",
    "ProcessPath": "/process",
    "TimeoutSeconds": 30
  }
}
```

For production deployment, replace development/local configuration with environment-appropriate values.

### Security Note

Do not commit production credentials, database passwords, JWT signing keys, or other secrets to the repository.

Use environment-specific configuration or secret management for production deployments.

---

## Getting Started

### Prerequisites

You will need:

* Node.js
* npm or Bun
* .NET 8 SDK
* Python
* PostgreSQL
* FFmpeg
* A modern browser with microphone access

The frontend is configured with Vite and contains both npm and Bun-related project files. The backend targets `.NET 8`, while the Python service requires `faster-whisper` and FFmpeg.

---

## 1. Clone the Repository

```bash
git clone https://github.com/leehdev0980/CaptionLive.git
cd CaptionLive
```

---

## 2. Configure PostgreSQL

Create a PostgreSQL database for CaptionLive.

Configure the backend connection string under:

```text
backend/CaptionBackend/
```

using the `CaptionDatabase` connection-string name.

The application configures Entity Framework Core to use PostgreSQL through Npgsql.

---

## 3. Start the Python Speech Service

Navigate to:

```bash
cd python-microservice
```

Install the required Python dependencies according to the project's Python environment/dependency setup.

Make sure FFmpeg is installed and available on the system `PATH`.

Start the service:

```bash
python app.py
```

The service listens on:

```text
http://localhost:5001
```

The health endpoint can be tested using:

```text
GET http://localhost:5001/ping
```

---

## 4. Start the ASP.NET Core Backend

Navigate to:

```bash
cd backend/CaptionBackend
```

Restore dependencies:

```bash
dotnet restore
```

Apply database migrations if required by the current database state:

```bash
dotnet ef database update
```

Run the backend:

```bash
dotnet run
```

When running in development mode, Swagger/OpenAPI is enabled.

---

## 5. Start the Frontend

Navigate to:

```bash
cd frontend/new_src
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend is configured around Vite and can then be accessed through the local development URL displayed by Vite.

---

## Development Commands

### Frontend

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run format
```

These commands are defined in the frontend `package.json`.

### Backend

```bash
dotnet restore
dotnet build
dotnet run
```

### Database

```bash
dotnet ef database update
```

---

## Testing

The repository contains testing and smoke-test utilities across the application.

The backend includes PowerShell smoke-test scripts for authentication and code-related workflows, while the Python microservice includes a ping test and test media-generation utility.

The frontend also includes linting and formatting commands.

Automated end-to-end coverage should be considered an area for continued development.

---

## Engineering Considerations

### Audio Chunk Reliability

Browser-generated MediaRecorder segments can occasionally be incomplete or difficult to decode individually.

CaptionLive accounts for this at the speech-processing layer by using FFmpeg with error-tolerant decoding behavior and returning an empty transcription instead of allowing a malformed audio segment to terminate the request pipeline.

### Separation of Speech Processing

Speech recognition is separated from the ASP.NET Core application into a Python microservice.

This keeps the AI/audio-processing workload isolated from the main application API and allows the speech-recognition implementation to use Python's machine-learning ecosystem.

### Real-Time Delivery

CaptionLive uses SignalR rather than repeatedly polling the backend for new captions.

This is particularly appropriate for a live captioning workflow because captions are event-driven: once a transcription is available, connected participants can receive it immediately.

### Persistent Session History

Captions are persisted before being broadcast.

This allows the application to provide both:

* Real-time caption delivery
* Historical caption retrieval

rather than treating the live caption stream as temporary data.

---

## Security Considerations

CaptionLive contains infrastructure for JWT bearer authentication and authorization, but the current backend implementation explicitly notes that endpoints are not yet protected by authorization attributes.

Therefore, authentication should be considered **partially implemented/infrastructure-ready rather than a fully enforced security layer** at the current repository state.

Additional production hardening should include:

* Strong production JWT signing secrets
* HTTPS
* Secure CORS configuration
* Protected API endpoints
* Proper authorization and role enforcement
* Secure management of PostgreSQL credentials
* Stronger audience/invitation code generation
* Rate limiting
* Input validation and upload limits
* Production logging and monitoring

The audience-code controller itself notes that its current token generation approach is not cryptographically secure, making stronger code generation an important future improvement.

---

## Current Limitations

The current implementation has several areas that should be considered when deploying CaptionLive beyond development.

### English-focused transcription

The current Whisper implementation explicitly invokes transcription with:

```text
language="en"
```

Therefore, the current speech-to-text pipeline is configured for English transcription rather than automatic multilingual transcription.

### CPU-based transcription

The current service loads:

```text
Whisper tiny
CPU
int8
```

This makes the service relatively lightweight but also limits transcription quality compared with larger Whisper models and may affect latency for more demanding workloads.

### Authentication enforcement

JWT authentication infrastructure exists, but API endpoint protection is not yet fully enforced.

### Audience code security

Audience codes currently use generated hexadecimal values and the controller comments that the current generation approach is not cryptographically secure.

### Production infrastructure

The repository currently separates the frontend, ASP.NET backend, and Python speech service. A production deployment therefore requires appropriate hosting and networking for all three components rather than treating the frontend deployment as the complete application.

---

## Roadmap

Potential improvements based on the current architecture include:

### Speech Recognition

* [ ] Support configurable Whisper models
* [ ] Improve multilingual transcription
* [ ] Improve handling of partial/chunked audio
* [ ] Evaluate GPU-accelerated inference
* [ ] Improve transcription latency

### Real-Time Captioning

* [ ] Improve caption synchronization
* [ ] Improve handling of overlapping audio segments
* [ ] Add stronger connection/reconnection handling
* [ ] Improve participant synchronization

### Authentication & Authorization

* [ ] Protect API endpoints with authorization
* [ ] Implement role-based permissions
* [ ] Strengthen JWT production configuration
* [ ] Improve invitation and audience-code security

### Collaboration

* [ ] Expand team management
* [ ] Improve speaker identification
* [ ] Add richer session controls
* [ ] Improve participant roles and permissions

### Accessibility

* [ ] Improve keyboard navigation
* [ ] Expand visual accessibility options
* [ ] Add customizable caption presentation
* [ ] Improve support for accessibility-focused workflows

### Infrastructure

* [ ] Containerize backend and speech services
* [ ] Add production monitoring
* [ ] Add CI/CD pipelines
* [ ] Add automated end-to-end testing
* [ ] Improve deployment configuration

---

## Project Status

**Current status:** Active development / prototype-to-production transition.

| Area                                | Status                   |
| ----------------------------------- | ------------------------ |
| React frontend                      | ✅ Implemented            |
| Session management                  | ✅ Implemented            |
| Browser audio capture               | ✅ Implemented            |
| ASP.NET Core backend                | ✅ Implemented            |
| PostgreSQL persistence              | ✅ Implemented            |
| Whisper microservice                | ✅ Implemented            |
| Real-time SignalR captions          | ✅ Implemented            |
| Session caption history             | ✅ Implemented            |
| Audience join codes                 | ✅ Implemented            |
| Team invitations                    | ✅ Implemented            |
| JWT authentication infrastructure   | 🚧 Partially implemented |
| Endpoint authorization              | 🚧 Incomplete            |
| Multilingual transcription          | 📋 Future enhancement    |
| Production security hardening       | 📋 Future enhancement    |
| Comprehensive automated E2E testing | 📋 Future enhancement    |

---

## Why This Architecture?

CaptionLive deliberately separates its responsibilities:

```text
Frontend
   │
   │ User interaction
   │ Audio capture
   │ Caption display
   ▼
ASP.NET Core
   │
   │ Application logic
   │ Persistence
   │ Real-time coordination
   ▼
┌───────────────┬────────────────┐
│               │                │
▼               ▼                ▼
PostgreSQL   SignalR       Python STT
                                  │
                                  ▼
                            Whisper + FFmpeg
```

This separation provides several advantages:

* The frontend remains focused on user interaction.
* The backend remains responsible for application logic and persistence.
* SignalR handles live communication independently from standard REST requests.
* Speech recognition can evolve independently of the main API.
* PostgreSQL provides durable session and caption history.

---

## Contributing

Contributions, improvements, bug reports, and suggestions are welcome.

Before submitting a change:

1. Create a feature branch.
2. Make the change.
3. Test the affected functionality.
4. Run the relevant linting/build/test commands.
5. Submit a pull request describing the change.

For larger changes, explain the architectural or behavioral impact in the pull request.

---

## License

No root-level license file is currently documented in the repository.

If this project is intended for public reuse, add an appropriate `LICENSE` file and update this section accordingly.

---

## Author

**Alex Muiruri**

Software Engineering student and developer interested in AI-powered applications, real-time systems, accessible technology, and software solutions designed for practical environments.

---

## Acknowledgements

CaptionLive builds on several open-source technologies, including:

* React
* Vite
* TanStack
* Tailwind CSS
* ASP.NET Core
* SignalR
* Entity Framework Core
* PostgreSQL
* Flask
* faster-whisper
* FFmpeg

---
