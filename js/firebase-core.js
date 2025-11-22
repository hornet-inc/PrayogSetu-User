/* ==========================================================
   FIREBASE CORE (Shared Across All Pages)
   - Initializes Firebase once
   - Handles Auth session persistence
   - Exposes global access flags:
       window.FirebaseReady
       window.UserEmail
       window.UserEmailBucket
       window.waitForFirebaseAuth(cb)
========================================================== */

// Prevent double initialization
if (!window.FirebaseCoreLoaded) {
  window.FirebaseCoreLoaded = true;

  const firebaseConfig = {
    apiKey: "AIzaSyCPa1qbQwQ1A5rQJAdHd5A42Ww8EPdelQ0",
    authDomain: "prayogsetu.firebaseapp.com",
    databaseURL: "https://prayogsetu-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "prayogsetu",
    storageBucket: "prayogsetu.appspot.com",
    messagingSenderId: "672822791748",
    appId: "1:672822791748:web:10c64ff3772dfb0f323611"
  };

  // Initialize Firebase once globally
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  window.auth = firebase.auth();
  window.db = firebase.database();

  // Globals
  window.FirebaseReady = false;
  window.UserEmail = null;
  window.UserEmailBucket = null;

  // Utility
  window.sanitizeEmail = (email) => email.replace(/\./g, "_");

  // Wait until Firebase identifies user
  window.waitForFirebaseAuth = function (callback) {
    const check = setInterval(() => {
      if (window.FirebaseReady) {
        clearInterval(check);
        callback();
      }
    }, 50);
  };

  // Auth persistence
  auth.setPersistence(firebase.auth.Auth.Persistence.SESSION).catch(() => {});

  // Auth watcher
  auth.onAuthStateChanged((user) => {
    if (user) {
      window.UserEmail = user.email;
      window.UserEmailBucket = sanitizeEmail(user.email);
      window.FirebaseReady = true;

      // Also store in sessionStorage (backup)
      sessionStorage.setItem("loggedInUserEmail", user.email);
    } else {
      window.FirebaseReady = false;
      window.UserEmail = null;
      window.UserEmailBucket = null;
    }
  });
}
