// firebase-sync.js

// 1. Firebase config (replace with your Firebase Console values)
const firebaseConfig = {
  apiKey: "AIzaSyDdcHJMlRaRxmdm6Lax6aPpdbGcG1oRVek",
  authDomain: "fuel-station-application-c1ba7.firebaseapp.com",
  projectId: "fuel-station-application-c1ba7",
  storageBucket: "fuel-station-application-c1ba7.appspot.com",
  messagingSenderId: "180888317297",
  appId: "1:180888317297:web:459e84b48ae4b99d0e5ad0",
  measurementId: "G-839CWGRGVY",
};

// 2. Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let docRef = null;
let redirectAttempted = false; // Prevent multiple redirects

// 3. Set persistence
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(console.error);

// 4. Handle redirect result (after redirect) FIRST
auth.getRedirectResult()
  .then((result) => {
    if (result.user) {
      onUserLoggedIn(result.user);
    } else {
      // Only try auto-signin once per page load
      if (!redirectAttempted) {
        redirectAttempted = true;
        autoSignIn();
      }
    }
  })
  .catch(console.error);

// 5. Listen for auth state changes
auth.onAuthStateChanged((user) => {
  if (user) {
    onUserLoggedIn(user);
  }
});

// 6. Helper function: Auto sign-in
function autoSignIn() {
  if (auth.currentUser) return; // already signed in
  const provider = new firebase.auth.GoogleAuthProvider();
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);

  if (isMobile) {
    console.log("📱 Mobile detected: Using redirect login");
    auth.signInWithRedirect(provider).catch(console.error);
  } else {
    console.log("💻 Desktop detected: Using popup login");
    auth.signInWithPopup(provider).catch(console.error);
  }
}

// 7. User logged in
function onUserLoggedIn(user) {
  docRef = db.collection("users").doc(user.uid);
  console.log("🔑 Signed in as " + user.email);
  if (typeof startCloudListener === "function") startCloudListener();
}

// 8. Optional: Sign out
function signOutUser() {
  return auth.signOut();
}

// 9. Getter for current user's document reference
function getDocRef() {
  return docRef;
}
