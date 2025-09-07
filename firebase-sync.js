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

// 1. Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let docRef = null;

// 2. Set persistence
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(console.error);

// 3. Handle redirect result first
auth.getRedirectResult()
  .then((result) => {
    if (result.user) {
      onUserLoggedIn(result.user);
    } else {
      // Only auto sign-in if no user and no redirect result
      if (!auth.currentUser) autoSignIn();
    }
  })
  .catch(console.error);

// 4. Listen for auth state changes
auth.onAuthStateChanged((user) => {
  if (user) {
    onUserLoggedIn(user);
  }
});

// 5. Helper functions
function autoSignIn() {
  const provider = new firebase.auth.GoogleAuthProvider();
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);
  if (isMobile) {
    auth.signInWithRedirect(provider);
  } else {
    auth.signInWithPopup(provider).catch(console.error);
  }
}

function onUserLoggedIn(user) {
  docRef = db.collection("users").doc(user.uid);
  log("🔑 Signed in as " + user.email);
  if (typeof startCloudListener === "function") startCloudListener();
}


// 4. Auth helpers (optional sign-out button)
function signOutUser() {
  return auth.signOut();
}

// 5. Expose docRef getter
function getDocRef() {
  return docRef;
}
