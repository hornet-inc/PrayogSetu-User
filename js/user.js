// ==========================
// USER DASHBOARD JS
// ==========================

// ===== AUTH CHECK =====
const loggedInEmail = sessionStorage.getItem("loggedInUserEmail");

// If user is NOT logged in → redirect to login
if (!loggedInEmail) {
    window.location.href = "login.html";
}

    // Show username before the first dot
    const username = loggedInEmail.split("@")[0].split(".")[0];
    const userNameEl = document.getElementById("userName");
    if (userNameEl) userNameEl.textContent = username.charAt(0).toUpperCase() + username.slice(1);

// ==========================
// LOGOUT FUNCTIONALITY
// ==========================
const logoutBtn = document.querySelector('.logout-btn');

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {

        // Clear user session
        sessionStorage.clear();

        // Firebase logout (if used)
        if (typeof firebase !== "undefined" && firebase.auth) {
            firebase.auth().signOut()
                .then(() => window.location.href = "login.html")
                .catch(error => alert("Logout failed: " + error.message));
        } else {
            window.location.href = "login.html";
        }
    });
}


// ==========================
// COMPONENT SEARCH FILTER
// (Only works on components.html)
// ==========================
const searchBox = document.querySelector('.search-box');

if (searchBox) {
    searchBox.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const components = document.querySelectorAll('.component-item');

        components.forEach(comp => {
            const name = comp.dataset.name.toLowerCase();
            comp.style.display = name.includes(query) ? 'block' : 'none';
        });
    });
}
