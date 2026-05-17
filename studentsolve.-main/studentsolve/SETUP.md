# StudentSolve — Local Setup Guide

## What you need before starting

- Node.js 18+ installed (check: `node -v`)
- An OpenAI account with an API key (https://platform.openai.com/api-keys)
- A Firebase account (https://firebase.google.com) — free tier is fine

---

## Step 1 — Get your OpenAI API key

1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy it — you'll paste it into `server/.env` in a moment

---

## Step 2 — Create a Firebase project

1. Go to https://console.firebase.google.com
2. Click "Add project" → name it `studentsolve` → click through to create it
3. **Enable Authentication:**
   - Click "Authentication" in the left sidebar
   - Click "Get started"
   - Click "Email/Password" → toggle Enable → Save
4. **Create Firestore:**
   - Click "Firestore Database" in the left sidebar
   - Click "Create database"
   - Choose "Start in test mode" (fine for local development)
   - Pick a region close to you → click Enable
5. **Get your Firebase config:**
   - Click the gear icon ⚙ → "Project settings"
   - Scroll down to "Your apps" → click the </> web icon
   - Register app as `studentsolve-client`
   - Copy the firebaseConfig object values — you'll need them next

---

## Step 3 — Create your .env files

### Backend — create `server/.env`

```
PORT=3001
OPENAI_API_KEY=sk-proj-PASTE_YOUR_KEY_HERE
```

### Frontend — create `client/.env`

```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:abcdef
```

Paste in the values from the Firebase config object you copied in Step 2.

---

## Step 4 — Install dependencies

Open two terminal tabs/windows.

**Terminal 1 — Backend:**
```bash
cd studentsolve/server
npm install
```

**Terminal 2 — Frontend:**
```bash
cd studentsolve/client
npm install
```

---

## Step 5 — Run the app

**Terminal 1 — start backend:**
```bash
cd studentsolve/server
npm run dev
# Should print: StudentSolve backend running at http://localhost:3001
```

**Terminal 2 — start frontend:**
```bash
cd studentsolve/client
npm run dev
# Should print: Local: http://localhost:5173
```

Open http://localhost:5173 in your browser.

---

## Step 6 — Test each feature

### Frontend loads
- Open http://localhost:5173
- You should see the StudentSolve landing page

### Backend health check
```bash
curl http://localhost:3001/api/health
# Expected: {"status":"ok","message":"StudentSolve backend is running."}
```

### Auth works
- Go to /signup, create an account
- You should be redirected to /dashboard
- Check Firebase Console → Authentication → Users to confirm

### AI Tutor
- Go to /tutor
- Type a question and press Send
- You should get a response from the AI

### Essay Marker
- Go to /essay-marker
- Select exam board + subject
- Paste an essay (at least a paragraph)
- Click "Mark essay"
- You should see AO breakdown, grade, strengths, improvements

### YouTube Notes
- Go to /notes
- Paste a YouTube URL (must be a video with captions/subtitles enabled)
- Click "Generate notes"
- You should see structured study notes

### Flashcards
- Go to /flashcards
- Paste some study notes
- Click "Generate flashcards"
- Flip cards by clicking them

### Save + Saved Work
- After any result, click "Save"
- Go to /saved to see your saved outputs

---

## Troubleshooting

### CORS error in browser console
Make sure you're using the Vite proxy — always fetch `/api/...` not `http://localhost:3001/api/...`.
The proxy in vite.config.js handles this automatically.

### "OPENAI_API_KEY is missing"
Check that `server/.env` exists and has your key. Restart the backend after editing .env.

### Firebase auth/invalid-api-key
Check that `client/.env` has all 6 VITE_FIREBASE_* values filled in correctly.
All Vite env vars must start with VITE_ to be accessible in the browser.

### YouTube transcript fails
The video must have captions enabled. Try a well-known educational video first (e.g., Khan Academy, Kurzgesagt). Private videos or videos with disabled captions will not work.

### Firestore index error in console
When you first use the Saved Work page, Firestore may ask you to create a composite index.
It will print a direct link in the browser console — click it and it auto-creates the index.

### Port already in use
If port 3001 or 5173 is taken:
- Change PORT in server/.env to e.g. 3002
- Update the proxy target in client/vite.config.js to match

### module not found errors
Make sure you ran `npm install` in BOTH the server/ and client/ folders separately.

---

## File placement reference

```
studentsolve/
├── firestore.rules          ← reference only, paste into Firebase Console rules tab
├── SETUP.md                 ← this file
├── server/
│   ├── .env                 ← YOU CREATE THIS (not in download, contains secrets)
│   ├── .env.example         ← template
│   ├── package.json
│   ├── server.js
│   ├── routes/
│   │   ├── tutor.js
│   │   ├── essay.js
│   │   ├── youtube.js
│   │   └── flashcards.js
│   ├── controllers/
│   │   ├── tutorController.js
│   │   ├── essayController.js
│   │   ├── youtubeController.js
│   │   └── flashcardsController.js
│   ├── middleware/
│   │   └── validateRequest.js
│   └── utils/
│       ├── openai.js
│       └── transcriptFetcher.js
└── client/
    ├── .env                 ← YOU CREATE THIS (not in download, contains Firebase config)
    ├── .env.example         ← template
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── styles/globals.css
        ├── context/AuthContext.jsx
        ├── firebase/
        │   ├── firebase.js
        │   └── firestore.js
        ├── services/api.js
        ├── components/
        │   ├── Navbar.jsx
        │   ├── Sidebar.jsx
        │   ├── ProtectedRoute.jsx
        │   ├── ChatMessage.jsx
        │   ├── FeatureCard.jsx
        │   ├── LoadingSpinner.jsx
        │   ├── FlashcardCard.jsx
        │   ├── ResultPanel.jsx
        │   └── FileUpload.jsx
        └── pages/
            ├── LandingPage.jsx
            ├── LoginPage.jsx
            ├── SignupPage.jsx
            ├── DashboardPage.jsx
            ├── TutorPage.jsx
            ├── EssayMarkerPage.jsx
            ├── NotesPage.jsx
            ├── FlashcardsPage.jsx
            ├── SavedPage.jsx
            └── SettingsPage.jsx
```
