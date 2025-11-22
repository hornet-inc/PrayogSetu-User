import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, set, update } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// ===== FIREBASE CONFIG =====
const firebaseConfig = {
  apiKey: "AIzaSyCPa1qbQwQ1A5rQJAdHd5A42Ww8EPdelQ0",
  authDomain: "prayogsetu.firebaseapp.com",
  databaseURL: "https://prayogsetu-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "prayogsetu",
  storageBucket: "prayogsetu.appspot.com",
  messagingSenderId: "672822791748",
  appId: "1:672822791748:web:10c64ff3772dfb0f323611"
};

// ===== INIT FIREBASE =====
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth();

// ===== ADMIN LOGIN =====
const ADMIN_EMAIL = "admin@presidencyuniversity.in";
const ADMIN_PASSWORD = "123456";

signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD)
  .then(userCred => {
    console.log("✅ Admin logged in:", ADMIN_EMAIL);
    const adminUID = userCred.user.uid;

    // ===== INITIALIZE USER BUCKETS =====
    // Replace with any test email you want to initialize
    const userEmail = "khaleel.20211eee0037@presidencyuniversity.in";
    const userKey = userEmail.replace(/\./g, "_"); // Firebase cannot have dots in keys

    const userRef = ref(db, `user/${userKey}`);

    const initialData = {
      request: {
        raised: {},
        approved: {},
        sanctioned: {},
        rejected: {},
        returned: {}
      },
      print: {
        link: "",
        status: ""
      },
      mentor: {
        Q: {},
        A: {}
      }
    };

    update(userRef, initialData)
      .then(() => {
        console.log("✅ User buckets initialized:", userEmail);
      })
      .catch(err => console.error("❌ Error initializing user buckets:", err));

  })
  .catch(err => {
    console.error("❌ Admin login failed:", err);
  });
