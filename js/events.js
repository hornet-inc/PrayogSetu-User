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
    // EVENTS LIST CONTAINER
    // ==========================
    const eventsListContainer = document.querySelector('.events-list');

    function renderEvents(events) {
        if (!eventsListContainer) return;

        eventsListContainer.innerHTML = ""; // Clear previous content

        if (!events || events.length === 0) {
            eventsListContainer.innerHTML = `<p style="color:#bbb; font-size:16px;">No events available.</p>`;
            return;
        }

        events.forEach(event => {
            const eventCard = document.createElement('div');
            eventCard.classList.add('event-card');

            eventCard.innerHTML = `
                <h3 class="event-title">${event.title}</h3>
                <p class="event-date">${event.date}</p>
                <p class="event-desc">${event.description}</p>
                <a href="${event.link || '#'}" target="_blank" class="event-btn">View Poster</a>
            `;

            eventsListContainer.appendChild(eventCard);
        });
    }

    // ==========================
    // FETCH GOOGLE SHEET LINK FROM FIREBASE
    // ==========================
    const DB_PATH = "events/stockLink";

    async function fetchSheetLink() {
        const snap = await firebase.database().ref(DB_PATH).once("value");
        return snap.val();
    }

    // ==========================
    // CONVERT SHEET TO CSV URL
    // ==========================
    function convertSheetToCSV(url) {
        const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (!match) return null;
        const sheetId = match[1];
        return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    }

    // ==========================
    // LOAD EVENTS FROM SHEET
    // ==========================
    async function loadEventsFromSheet(url) {
        try {
            const csvURL = convertSheetToCSV(url);
            if (!csvURL) return;

            const res = await fetch(csvURL);
            const csvText = await res.text();

            const workbook = XLSX.read(csvText, { type: "string", raw: false });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

            // Map rows → event objects
            const events = rows.map(r => {
                // Dynamically detect header names (trim + lowercase)
                const titleKey = Object.keys(r).find(k => k.trim().toLowerCase() === "event name") || "Event Name";
                const dateKey = Object.keys(r).find(k => k.trim().toLowerCase() === "date") || "Date";
                const descKey = Object.keys(r).find(k => k.trim().toLowerCase() === "description") || "Description";
                const fileKey = Object.keys(r).find(k => k.trim().toLowerCase() === "file") || "File";

                return {
                    title: r[titleKey] || "Untitled Event",
                    date: r[dateKey] || "",
                    description: r[descKey] || "",
                    link: r[fileKey] || "#"
                };
            });

            renderEvents(events);

        } catch (err) {
            console.error("Error loading events sheet:", err);
            renderEvents([]);
        }
    }

    // ==========================
    // INIT
    // ==========================
    async function init() {
        const sheetURL = await fetchSheetLink();
        if (sheetURL) {
            console.log("Loading Events from:", sheetURL);
            await loadEventsFromSheet(sheetURL);
        } else {
            console.log("No Event Sheet found in Firebase.");
            renderEvents([]);
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
