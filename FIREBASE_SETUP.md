# Firebase Setup Guide

## Issue
The application is showing `FirebaseError: Firebase: Error (auth/invalid-api-key)` because Firebase configuration is missing.

## Solution

### Step 1: Create Environment File
Create a `.env.local` file in the project root with the following content:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Step 2: Get Firebase Configuration
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Go to Project Settings (gear icon) > General tab
4. Scroll down to "Your apps" section
5. If you don't have a web app, click "Add app" and select the web icon
6. Copy the configuration values from the Firebase config object

### Step 3: Enable Authentication
1. In Firebase Console, go to Authentication > Sign-in method
2. Enable the authentication methods you want to use (Email/Password, Google, etc.)

### Step 4: Set up Firestore Database
1. In Firebase Console, go to Firestore Database
2. Create a database in production mode
3. The security rules are already configured in `firestore.rules`

### Step 5: Restart the Development Server
After creating the `.env.local` file, restart the development server:
```bash
npm run dev
```

## Alternative: Use Firebase CLI
If you have Firebase CLI installed, you can also run:
```bash
firebase login
firebase init
```

This will guide you through the setup process.



