document.addEventListener("DOMContentLoaded", () => {

    const loggedInEmail = sessionStorage.getItem("loggedInUserEmail");
    if (!loggedInEmail) {
        window.location.href = "login.html";
        return;
    }

    // Display username
    const username = loggedInEmail.split("@")[0].split(".")[0];
    const userNameEl = document.getElementById("userName");
    if (userNameEl)
        userNameEl.textContent = username.charAt(0).toUpperCase() + username.slice(1);

    // =====================================================
    // PROJECT LIST
    // =====================================================
    let projectData = [];
    const projectListContainer = document.querySelector(".projects-list");

    function renderProjects(list) {
        projectListContainer.innerHTML = "";

        if (!list || list.length === 0) {
            projectListContainer.innerHTML = `
                <p style="color:#bbb; font-size:16px;">No projects available.</p>
            `;
            return;
        }

        list.forEach(p => {
            const card = document.createElement("div");
            card.classList.add("project-card");

            card.innerHTML = `
                <img src="${p.image || 'default.jpg'}" class="project-image" alt="Project Image">
                <h3 class="project-title">${p.title}</h3>
                <p class="project-desc">${p.desc}</p>
                <p class="project-meta"><strong>Category:</strong> ${p.category}</p>
                <a href="${p.link}" target="_blank" class="project-btn">View Project</a>
            `;

            projectListContainer.appendChild(card);
        });
    }

    // =====================================================
    // SEARCH PROJECTS
    // =====================================================
    const searchBox = document.querySelector(".search-box");

    if (searchBox) {
        searchBox.addEventListener("input", e => {
            const q = e.target.value.toLowerCase();

            const filtered = projectData.filter(p =>
                p.title.toLowerCase().includes(q) ||
                p.desc.toLowerCase().includes(q) ||
                p.category.toLowerCase().includes(q)
            );

            renderProjects(filtered);
        });
    }

    // =====================================================
    // FIREBASE → GET SHEET LINK
    // =====================================================
    const DB_PATH = "projects/stockLink";

    async function fetchSheetLink() {
        const snap = await firebase.database().ref(DB_PATH).once("value");
        return snap.val();
    }

    // =====================================================
    // GOOGLE SHEETS → CSV → JSON
    // =====================================================
    function convertSheetToCSV(url) {
        const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (!match) return null;

        const sheetId = match[1];
        return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    }

    async function loadProjectsFromSheet(url) {
        try {
            const csvURL = convertSheetToCSV(url);
            if (!csvURL) return;

            const res = await fetch(csvURL);
            const csvText = await res.text();

            const workbook = XLSX.read(csvText, { type: "string", raw: false });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

            // Convert rows → project objects
            projectData = rows.map(r => {
                const imageKey = Object.keys(r).find(k => k.trim().toLowerCase() === "image") || "Image";
                return {
                    title: r["Project Name"] || "Untitled Project",
                    desc: r["Description"] || "",
                    category: r["Category"] || "General",
                    image: r[imageKey] || "",   // <-- just take the web URL
                    link: r["File"] || "#"
                };
            });

            renderProjects(projectData);

        } catch (err) {
            console.error("Error loading sheet:", err);
            renderProjects([]);
        }
    }

    // =====================================================
    // INIT LOADING
    // =====================================================
    async function init() {
        const sheetURL = await fetchSheetLink();

        if (sheetURL) {
            console.log("Loading Projects from:", sheetURL);
            await loadProjectsFromSheet(sheetURL);
        } else {
            console.log("No Project Sheet found in Firebase.");
            renderProjects([]);
        }
    }

    init();

    // =====================================================
    // LOGOUT
    // =====================================================
    const logoutBtn = document.querySelector(".logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            sessionStorage.clear();
            window.location.href = "login.html";
        });
    }

});
