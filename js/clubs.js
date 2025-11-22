document.addEventListener("DOMContentLoaded", () => {

    const loggedInEmail = sessionStorage.getItem("loggedInUserEmail");
    if (!loggedInEmail) {
        window.location.href = "login.html";
        return;
    }

    // Show username before the first dot
    const username = loggedInEmail.split("@")[0].split(".")[0];
    const userNameEl = document.getElementById("userName");
    if (userNameEl) userNameEl.textContent = username.charAt(0).toUpperCase() + username.slice(1);

    // ==========================
    // CLUBS DATA FETCH
    // ==========================
    const clubsListContainer = document.querySelector(".clubs-list");
    const DB_PATH = "clubs/stockLink"; // Firebase DB path

    function convertSheetToCSV(url) {
        const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (!match) return null;
        const sheetId = match[1];
        return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    }

    function fixImageURL(url) {
        if (!url) return "";
        // Check if it’s already a web URL
        if (url.startsWith("http")) return url;
        return ""; // fallback empty
    }

    async function fetchSheetLink() {
        const snap = await firebase.database().ref(DB_PATH).once("value");
        return snap.val();
    }

    function renderClubs(list) {
        clubsListContainer.innerHTML = "";
        if (!list || list.length === 0) {
            clubsListContainer.innerHTML = `<p style="color:#bbb;">No clubs available.</p>`;
            return;
        }

        list.forEach(c => {
            const card = document.createElement("div");
            card.classList.add("club-card");

            const imageUrl = fixImageURL(c.image);

            card.innerHTML = `
                <h3 class="club-title">${c.name}</h3>
                ${imageUrl ? `<img src="${imageUrl}" class="club-image" alt="${c.name}">` : ""}
                <p class="club-desc">${c.description}</p>
            `;

            clubsListContainer.appendChild(card);
        });
    }

    async function loadClubsFromSheet(url) {
        try {
            const csvURL = convertSheetToCSV(url);
            if (!csvURL) return;

            const res = await fetch(csvURL);
            const csvText = await res.text();

            const workbook = XLSX.read(csvText, { type: "string", raw: false });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

            const clubsData = rows.map(r => {
                const nameKey = Object.keys(r).find(k => k.trim().toLowerCase() === "club name") || "Club Name";
                const descKey = Object.keys(r).find(k => k.trim().toLowerCase() === "description") || "Description";
                const imageKey = Object.keys(r).find(k => k.trim().toLowerCase() === "image") || "Image";

                return {
                    name: r[nameKey] || "Unnamed Club",
                    description: r[descKey] || "",
                    image: r[imageKey] || ""
                };
            });

            renderClubs(clubsData);

        } catch (err) {
            console.error("Error loading clubs:", err);
            renderClubs([]);
        }
    }

    async function init() {
        const sheetURL = await fetchSheetLink();
        if (sheetURL) {
            console.log("Loading Clubs from:", sheetURL);
            await loadClubsFromSheet(sheetURL);
        } else {
            console.log("No Clubs Sheet found in Firebase.");
            renderClubs([]);
        }
    }

    init();

    // ===== LOGOUT =====
    const logoutBtn = document.querySelector(".logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            sessionStorage.clear();
            window.location.href = "login.html";
        });
    }

});
