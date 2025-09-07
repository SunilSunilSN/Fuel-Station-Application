// firebase-sync.js

// 1. Firebase config (replace with your Firebase Console values)
const firebaseConfig = {
  apiKey: "AIzaSyDdcHJMlRaRxmdm6Lax6aPpdbGcG1oRVek",
  authDomain: "fuel-station-application-c1ba7.firebaseapp.com",
  projectId: "fuel-station-application-c1ba7",
  storageBucket: "fuel-station-application-c1ba7.firebaseapp.com",
  messagingSenderId: "180888317297",
  appId: "1:180888317297:web:459e84b48ae4b99d0e5ad0",
  measurementId: "G-839CWGRGVY",
};

// 2. Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Enable offline persistence
db.enablePersistence().catch((err) => {
  console.warn("⚠️ Persistence not available:", err.code);
});

let docRef = null;

// 3. Auth handling with auto sign-in
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

auth.onAuthStateChanged((user) => {
  if (user) {
    // Logged in
    docRef = db.collection("users").doc(user.uid);
    log("🔑 Signed in as " + user.email);

    if (typeof startCloudListener === "function") {
      startCloudListener(); // from common.js
    }
  } else {
    // Not logged in → auto sign in with Google
    docRef = null;
    log("⚠️ No user, signing in with Google...");

    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch((err) => {
      console.error("Google sign-in failed", err);
      log("❌ Google sign-in failed: " + err.message);
    });
  }
});

// 4. Auth helpers (optional sign-out button)
function signOutUser() {
  return auth.signOut();
}

// 5. Expose docRef getter
function getDocRef() {
  return docRef;
}
