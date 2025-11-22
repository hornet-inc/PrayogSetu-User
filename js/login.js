/* ==========================================================
   LOGIN.JS
========================================================== */

const popupOverlay = document.getElementById("popupOverlay");
function showPopup(type, message) {
  document.getElementById("popupTitle").textContent = type === "success" ? "Success" : "Error";
  document.getElementById("popupText").textContent = message;
  popupOverlay.style.display = "flex";
}
function closePopup() {
  popupOverlay.style.display = "none";
}

// Login form submit handler
document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email.endsWith("@presidencyuniversity.in")) {
    showPopup("error", "Please use your official Presidency University email ID.");
    return;
  }

  auth.signInWithEmailAndPassword(email, password)
    .then((cred) => {
      const user = cred.user;
      sessionStorage.setItem("loggedInUserEmail", user.email);

      // Update global flags
      window.UserEmail = user.email;
      window.UserEmailBucket = sanitizeEmail(user.email);
      window.FirebaseReady = true;

      showPopup("success", "Login successful! Redirecting...");
      setTimeout(() => {
        window.location.href = "user.html";
      }, 1200);
    })
    .catch((err) => {
      showPopup("error", err.message);
    });
});
