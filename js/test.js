import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, update, get, child } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// ================== FIREBASE INIT ==================
const firebaseConfig = {
  apiKey: "AIzaSyCPa1qbQwQ1A5rQJAdHd5A42Ww8EPdelQ0",
  authDomain: "prayogsetu.firebaseapp.com",
  databaseURL: "https://prayogsetu-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "prayogsetu",
  storageBucket: "prayogsetu.appspot.com",
  messagingSenderId: "672822791748",
  appId: "1:672822791748:web:10c64ff3772dfb0f323611"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth();

// ================== HARD-CODED LOGIN ==================
const ADMIN_EMAIL = "admin@presidencyuniversity.in";
const ADMIN_PASSWORD = "123456";

signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD)
  .then(userCred => {
    console.log("✅ Admin Logged in:", ADMIN_EMAIL);
    document.getElementById("userID").value = ADMIN_EMAIL;
    document.getElementById("fetchUserID").value = ADMIN_EMAIL;
  })
  .catch(err => {
    console.error("❌ Admin login failed:", err);
    alert("Admin login failed: " + err.message);
  });

// ================== PUSH DATA ==================
document.getElementById("sendBtn").addEventListener("click", () => {
  const email = document.getElementById("userID").value.trim();
  const opPath = document.getElementById("operation").value;
  const dataValue = document.getElementById("dataValue").value.trim();

  if (!dataValue) {
    alert("Enter a value to push!");
    return;
  }

  // Append new entry under timestamp
  const timestamp = Date.now();
  const fullPath = `user/${email}/${opPath}/${timestamp}`;
  const dataObj = { value: dataValue, timestamp };

  console.log("📤 Writing to:", fullPath, dataObj);

  update(ref(db, fullPath))
    .then(() => console.log("✅ Write successful"))
    .catch(err => console.error("❌ Write error:", err));
});

// ================== FETCH DATA ==================
document.getElementById("fetchBtn").addEventListener("click", () => {
  const email = document.getElementById("fetchUserID").value.trim();
  const key = document.getElementById("fetchKey").value.trim();

  const fullPath = `user/${email}/${key}`;
  console.log("📥 Fetching:", fullPath);

  get(child(ref(db), fullPath))
    .then(snapshot => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        document.getElementById("output").textContent = JSON.stringify(data, null, 2);
        console.log("✅ Fetch success:", data);
      } else {
        document.getElementById("output").textContent = "No data found.";
        console.warn("⚠️ No data at path:", fullPath);
      }
    })
    .catch(err => console.error("❌ Fetch error:", err));
});
