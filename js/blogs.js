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
    // BLOG CARDS DYNAMIC DATA
    // ==========================
    const blogsList = document.querySelector('.blogs-list');
    let blogsData = [];

    function fixImageURL(url) {
        if (!url) return "";
        // Return the URL directly if it's already a web image link
        return url;
    }

    function renderBlogs(list) {
        if (!blogsList) return;

        blogsList.innerHTML = "";

        if (!list || list.length === 0) {
            blogsList.innerHTML = `<p style="color:#bbb; font-size:16px;">No blogs available.</p>`;
            return;
        }

        list.forEach(blog => {
            const fixedImage = fixImageURL(blog.image);

            const blogCard = document.createElement('div');
            blogCard.classList.add('blog-card');

            blogCard.innerHTML = `
                <h3 class="blog-title">${blog.title}</h3>
                <p class="blog-desc">${blog.description}</p>
                <a href="${blog.link}" class="blog-btn" target="_blank">Read More</a>
            `;

            blogsList.appendChild(blogCard);
        });
    }

    // ==========================
    // FIREBASE → GET SHEET LINK
    // ==========================
    const DB_PATH = "blogs/stockLink";

    async function fetchSheetLink() {
        const snap = await firebase.database().ref(DB_PATH).once("value");
        return snap.val();
    }

    // ==========================
    // GOOGLE SHEETS → CSV → JSON
    // ==========================
    function convertSheetToCSV(url) {
        const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (!match) return null;

        const sheetId = match[1];
        return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    }

    async function loadBlogsFromSheet(url) {
        try {
            const csvURL = convertSheetToCSV(url);
            if (!csvURL) return;

            const res = await fetch(csvURL);
            const csvText = await res.text();

            const workbook = XLSX.read(csvText, { type: "string", raw: false });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

            blogsData = rows.map(r => {
                // Detect Image column dynamically
                const imageKey = Object.keys(r).find(k => k.trim().toLowerCase() === "image") || "Image";
                return {
                    title: r["Blog Name"] || "Untitled Blog",
                    description: r["Description"] || "",
                    link: r["File"] || "#"
                };
            });

            renderBlogs(blogsData);

        } catch (err) {
            console.error("Error loading blogs sheet:", err);
            renderBlogs([]);
        }
    }

    // ==========================
    // INIT LOADING
    // ==========================
    async function init() {
        const sheetURL = await fetchSheetLink();

        if (sheetURL) {
            console.log("Loading Blogs from:", sheetURL);
            await loadBlogsFromSheet(sheetURL);
        } else {
            console.log("No Blogs Sheet found in Firebase.");
            renderBlogs([]);
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
