# Firebase Setup Instructions

## Step 1: Create a Firebase Project

1. Go to https://console.firebase.google.com
2. Click "Add project" or "Create a project"
3. Enter a project name (e.g., "ballyraine-goals")
4. Disable Google Analytics (optional, you can enable it later)
5. Click "Create project"

## Step 2: Enable Realtime Database

1. In your Firebase project, click on "Realtime Database" in the left sidebar
2. Click "Create Database"
3. Choose a location (closest to your users)
4. Start in **test mode** (we'll update security rules later)
5. Click "Enable"

## Step 3: Get Your Firebase Configuration

1. In Firebase Console, click the gear icon ⚙️ next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon `</>` to add a web app
5. Register your app with a nickname (e.g., "Ballyraine Goals")
6. Copy the `firebaseConfig` object

## Step 4: Update Your HTML File

1. Open `index.html`
2. Find the `firebaseConfig` object (around line 800)
3. Replace the placeholder values with your actual Firebase config:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_ACTUAL_API_KEY",
    authDomain: "your-project-id.firebaseapp.com",
    databaseURL: "https://your-project-id-default-rtdb.firebaseio.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
};
```

## Step 5: Set Up Security Rules (Important!)

1. In Firebase Console, go to "Realtime Database"
2. Click on the "Rules" tab
3. Replace the rules with:

```json
{
  "rules": {
    "players": {
      ".read": true,
      ".write": true
    }
  }
}
```

**Note:** These rules allow anyone to read/write. For production, you should add authentication. For now, this is fine for testing.

## Step 6: Test It!

1. Open your website
2. Add a goal to a player
3. Check Firebase Console > Realtime Database
4. You should see the data appear under `players/[playerName]`

## Free Tier Limits

Firebase Realtime Database free tier includes:
- 1 GB storage
- 10 GB/month bandwidth
- 100 concurrent connections
- Unlimited reads/writes (within bandwidth limits)

This should be more than enough for tracking player goals!

## Viewing Your Data

You can view all player goals in the Firebase Console:
1. Go to Realtime Database
2. Click on "players"
3. You'll see all players and their goal data

## Exporting Data

To export your data:
1. In Firebase Console, go to Realtime Database
2. Click the three dots menu (⋮)
3. Select "Export JSON"
4. Save the file
