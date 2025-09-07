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

// 3. Set persistence once
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .catch(console.error);

// 4. Handle redirect result on page load
// This is called AFTER the redirect returns.
auth.getRedirectResult()
  .then((result) => {
    if (result.user) {
      onUserLoggedIn(result.user);
    }
  })
  .catch(console.error);

// 5. Listen for auth state changes for ongoing session management
auth.onAuthStateChanged((user) => {
  if (user) {
    onUserLoggedIn(user);
  } else {
    onUserSignedOut(); // Add a function to handle signed-out state
  }
});

// 6. User-initiated sign-in function
// This function should be called from a button click or other user action.
function signInWithGoogle() {
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

// 8. User signed out
function onUserSignedOut() {
  docRef = null;
  console.log("🚶 User signed out.");
  // Add logic to show login button and hide user content
}

// 9. Optional: Sign out function
function signOutUser() {
  return auth.signOut();
}

// 10. Getter for current user's document reference
function getDocRef() {
  return docRef;
}