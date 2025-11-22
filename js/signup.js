// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCPa1qbQwQ1A5rQJAdHd5A42Ww8EPdelQ0",
  authDomain: "prayogsetu.firebaseapp.com",
  databaseURL: "https://prayogsetu-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "prayogsetu",
  storageBucket: "prayogsetu.appspot.com",
  messagingSenderId: "672822791748",
  appId: "1:672822791748:web:10c64ff3772dfb0f323611"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Signup form
const signupForm = document.getElementById("signupForm");

signupForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const roll = document.getElementById("roll").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  // Validation
  if (!email.endsWith("@presidencyuniversity.in")) {
    showPopup("Error", "Please use your official Presidency University email ID.");
    return;
  }

  if (password !== confirmPassword) {
    showPopup("Error", "Passwords do not match.");
    return;
  }

  if (password.length < 6) {
    showPopup("Error", "Password should be at least 6 characters long.");
    return;
  }

  // Create user
  auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;

      // Update user profile
      user.updateProfile({
        displayName: name,
        phoneNumber: phone
      });

      // Send email verification
      user.sendEmailVerification()
        .then(() => {
          showPopup(
            "Verify Your Email",
            "A verification email has been sent to your email address. Please check your inbox or spam folder and click the link to verify your account.",
            true // redirect flag
          );
          signupForm.reset();
        })
        .catch((error) => {
          showPopup("Error", "Failed to send verification email: " + error.message);
        });
    })
    .catch((error) => {
      showPopup("Error", "Signup failed: " + error.message);
    });
});

// Function to show pop-up dialog boxes
function showPopup(title, message, redirectToLogin = false) {
  const overlay = document.createElement("div");
  overlay.classList.add("popup-overlay");

  overlay.innerHTML = `
    <div class="popup-content">
      <h2>${title}</h2>
      <p>${message}</p>
      <button class="popup-close">OK</button>
    </div>
  `;

  // Append overlay to body
  document.body.appendChild(overlay);
  
  // Only blur the main content, not the popup
  document.querySelector(".main-content").classList.add("blur-background");

  // Close button
  const closeBtn = overlay.querySelector(".popup-close");
  closeBtn.addEventListener("click", () => {
    document.body.removeChild(overlay);
    document.querySelector(".main-content").classList.remove("blur-background");

    if (redirectToLogin) {
      window.location.href = "login.html";
    }
  });
}
