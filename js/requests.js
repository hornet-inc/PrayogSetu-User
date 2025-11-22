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

    // ===== LOGOUT =====
    const logoutBtn = document.querySelector(".logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            sessionStorage.clear();
            window.location.href = "login.html";
        });
    }

});

/* ======================================================
   FIREBASE FROM CORE FILE
======================================================= */

// Firebase is already initialized in firebase-core.js
const auth = firebase.auth();
const db = firebase.database();

/* ======================================================
   UTILITY FUNCTIONS
======================================================= */

function getEmailBucket() {
  return sessionStorage.getItem("loggedInUserEmail")?.replace(/\./g, "_");
}

async function writeRequest(productId, valueObj) {
  const emailBucket = getEmailBucket();
  if (!emailBucket) return alert("User not logged in");

  const mainRef = db.ref(`requests/${emailBucket}/${productId}`);
  const historyRef = mainRef.child("history");

  const timestamp = Date.now();

  // Create main bucket only once
  const snap = await mainRef.once("value");

  if (!snap.exists()) {
    await mainRef.set({
      history: {}   // very important to pre-create history
    });
  }

  // Append timestamp entry under history
  await historyRef.child(timestamp).set(valueObj);

  return true;
}

/* ======================================================
   LOOKUP (Google Sheet-based Modal Fetch)
===================================================== */

/* ======================================================
   LOOKUP (Google Sheet-based Modal Fetch)
===================================================== */

// Make sure you include PapaParse in your HTML:
// <script src="https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js"></script>

async function getSheetLinkFromFirebase() {
    try {
        const snap = await db.ref("components/stockLink").once("value");
        return snap.val();
    } catch (err) {
        console.error("Error reading sheet link from Firebase:", err);
        return null;
    }
}

// Convert Google Sheet URL to CSV export link
function convertSheetToCSV(url) {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) return null;
    const sheetId = match[1];
    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
}

// Fetch and parse CSV from Google Sheet using PapaParse
async function fetchInventoryDataFromSheet(sheetURL) {
    if (!sheetURL) return {};
    const csvURL = convertSheetToCSV(sheetURL);
    if (!csvURL) return {};

    try {
        const resp = await fetch(csvURL);
        const csvText = await resp.text();

        const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
        const data = {};
        parsed.data.forEach(row => {
            if (row["Component ID"]) data[row["Component ID"]] = row;
        });

        return data;
    } catch (err) {
        console.error("Error fetching sheet CSV:", err);
        return {};
    }
}

// Fetch product data and fill modal
document.getElementById("fetchProductBtn").addEventListener("click", async () => {
    const id = document.getElementById("productIdInput").value.trim();
    if (!id) return alert("Enter Component ID first!");

    try {
        // Try fetching from Google Sheet first
        const sheetLink = await getSheetLinkFromFirebase();
        let inventoryData = {};
        if (sheetLink) inventoryData = await fetchInventoryDataFromSheet(sheetLink);

        let item = inventoryData[id];

        // Fallback: if item not in Google Sheet, load from local stock.xlsx
        if (!item) {
            const stockData = await loadStockExcel();
            item = stockData.find(row => (row["Component ID"] || "").trim() === id);
        }

        if (!item) return alert("Component not found!");

        // Fill modal
        document.getElementById("modalProductId").innerText = item["Component ID"] || id;
        document.getElementById("modalProductName").innerText = item["Component Name"] || "—";
        document.getElementById("modalTotalQty").innerText = item["Total Quantity"] || "—";
        document.getElementById("modalAvailQty").innerText = item["Quantity Available"] || "—";
        document.getElementById("modalDesc").innerText = item["Description"] || "—";

        // Determine request type: prioritize Google Sheet, fallback to stock
        const reqType = (item["Request Type"] || "Normal").trim();
        document.getElementById("modalReqType").innerText = reqType;

        // Set requested quantity in modal preview
        const qtyInput = document.getElementById("productQtyInput");
        document.getElementById("modalReqQty").innerText = qtyInput.value || "—";

        // Show/hide special request block
        const specialBlock = document.getElementById("specialBlock");
        const specialInput = document.getElementById("specialConcern");
        if (reqType.toLowerCase() === "special") {
            specialBlock.style.display = "block";
            specialInput.value = ""; // clear previous
        } else {
            specialBlock.style.display = "none";
            specialInput.value = "";
        }

        // Open modal
        const modal = document.getElementById("productModal");
        modal.style.display = "flex";
        document.body.classList.add("blurred-bg");

    } catch (err) {
        console.error(err);
        alert("Error fetching component data!");
    }
});


/* ======================================================
   MODAL CLOSE
===================================================== */
function closeProductModal() {
    const modal = document.getElementById("productModal");
    modal.style.display = "none";
    document.getElementById("specialConcern").value = "";
    document.body.classList.remove("blurred-bg"); // remove blur
}

document.getElementById("modalClose").addEventListener("click", closeProductModal);
document.getElementById("cancelRequestBtn").addEventListener("click", closeProductModal);

/* ======================================================
   SUBMIT NORMAL REQUEST
===================================================== */
document.getElementById("submitRequestBtn").addEventListener("click", async () => {

    const pid = document.getElementById("modalProductId").innerText;
    const reqType = document.getElementById("modalReqType").innerText;

    // Get requested quantity
    const qtyInput = document.getElementById("productQtyInput");
    const reqQty = parseInt(qtyInput.value.trim(), 10);
    if (!reqQty || reqQty <= 0) return alert("Enter a valid requested quantity!");

    let specialNote = "";
    if ((reqType || "").trim().toLowerCase() === "special") {
        specialNote = document.getElementById("specialConcern").value.trim();
        if (!specialNote) return alert("Explain special request!");
    }

    const entry = {
        status: "raised",
        time: Date.now(),
        requestType: reqType,
        requestedQty: reqQty,
        specialNote: specialNote
    };

    await writeRequest(pid, entry);

    // Show success modal
    const successModal = document.getElementById("successModal");
    const successMessage = document.getElementById("successMessage");
    const successOkBtn = document.getElementById("successOkBtn");

    successMessage.textContent = "Request submitted successfully!";
    successModal.style.display = "flex";
    document.body.classList.add("blurred-bg");

    // OK button closes success modal
    successOkBtn.onclick = () => {
        successModal.style.display = "none";
        document.body.classList.remove("blurred-bg");
    };

    // Close product modal and clear input
    closeProductModal();
    qtyInput.value = "";
});


/* ======================================================
   USER STATUS PANEL (Components + 3D Print ONLY)
   Real-time updating, unified cards
======================================================= */
function loadUnifiedStatusPanels() {
    const emailBucket = getEmailBucket();
    if (!emailBucket) return;

    const statusMap = {
        raised: document.getElementById("listRaised"),
        approved: document.getElementById("listApproved"),
        delivered: document.getElementById("listDelivered"),
        rejected: document.getElementById("listRejected"),
        returned: document.getElementById("listReturned")
    };

    // Real-time listener
    db.ref(`requests/${emailBucket}`).on("value", (snap) => {
        // Clear all cards first
        Object.values(statusMap).forEach(el => { if (el) el.innerHTML = ""; });

        const data = snap.val();
        if (!data) return;

        Object.entries(data).forEach(([key, item]) => {
            // Only include Components and 3D_Print
            if (key === "Mentor_Support" || key === "Other_Custom_Type") return; // skip anything else

            const history = item.history || {};
            const sortedTimestamps = Object.keys(history).sort((a,b)=>Number(a)-Number(b));

            sortedTimestamps.forEach(ts => {
                const entry = history[ts];
                const status = (entry.status || "raised").toLowerCase();

                // Timestamp logic: raised → bucket key; others → entry.time
                let timestamp = ts;
                if (status !== "raised" && entry.time) timestamp = entry.time;

                const displayTimestamp = new Date(Number(timestamp)).toLocaleString();
                const name = key === "3D_Print" ? "3D_Print" : key;

                const card = document.createElement("div");
                card.className = "status-text-item";
                card.innerHTML = `
                    <div><strong>${name}</strong></div>
                    <div>${status.toUpperCase()} (${displayTimestamp})</div>
                `;

                if (statusMap[status]) {
                    statusMap[status].appendChild(card);
                } else {
                    statusMap.raised.appendChild(card);
                }
            });
        });
    });
}

// Initialize real-time unified status panels
loadUnifiedStatusPanels();

/* ======================================================
   3D PRINT REQUEST
======================================================= */

document.getElementById("submitPrintBtn").addEventListener("click", async () => {
  const link = document.getElementById("printDriveLink").value.trim();
  const printName = document.getElementById("printNameInput").value.trim();
  const material = document.getElementById("printMaterial").value;

  if (!printName) return alert("Enter a Print Name!");
  if (!link) return alert("Enter Drive link!");

  const entry = { 
    requestType: printName,
    link, 
    material, 
    status: "raised", 
    time: Date.now()
  };

  await writeRequest("3D_Print", entry);

  alert("3D print request added!");
});


/* ======================================================
   MENTOR SUPPORT CHAT
===================================================== */

const mentorChatWindow = document.getElementById("mentorChatWindow");
const mentorQuestionInput = document.getElementById("mentorQuestion");

// Format timestamp
function formatTime(ts) {
  const date = new Date(Number(ts));
  if (isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Add chat message bubble
function addChatMessage(msg, type, time) {
  if (!msg) return;

  const msgDiv = document.createElement("div");
  msgDiv.className = type === "user" ? "msg msg-user" : "msg msg-mentor";

  const bodyDiv = document.createElement("div");
  bodyDiv.className = "msg-body";
  bodyDiv.innerText = msg;

  const metaDiv = document.createElement("div");
  metaDiv.className = "msg-meta";
  metaDiv.innerText = formatTime(time);

  msgDiv.appendChild(bodyDiv);
  msgDiv.appendChild(metaDiv);
  mentorChatWindow.appendChild(msgDiv);

  // Auto scroll to bottom
  mentorChatWindow.scrollTop = mentorChatWindow.scrollHeight;
}

// Send message
document.getElementById("submitMentorBtn").addEventListener("click", async () => {
  const q = mentorQuestionInput.value.trim();
  if (!q) return alert("Enter your question!");

  const entry = {
    query: q,
    time: Date.now()
  };

  await writeRequest("Mentor_Support", entry);
  mentorQuestionInput.value = "";
});

// Load mentor chat real-time
function loadMentorChat() {
  const emailBucket = getEmailBucket();
  if (!emailBucket) return;

  const historyRef = db.ref(`requests/${emailBucket}/Mentor_Support/history`);
  historyRef.on("value", (snap) => {
    mentorChatWindow.innerHTML = ""; // clear previous

    if (!snap.exists()) {
      const emptyNote = document.createElement("div");
      emptyNote.className = "empty-chat-note";
      emptyNote.style.textAlign = "center";
      emptyNote.style.color = "#666";
      emptyNote.style.padding = "40px 0";
      emptyNote.innerText = "No messages yet — ask your mentor.";
      mentorChatWindow.appendChild(emptyNote);
      return;
    }

    const history = snap.val();
    const timestamps = Object.keys(history).sort((a,b)=>a-b);

    timestamps.forEach(ts => {
      const entry = history[ts];
      const time = entry.time || ts;

      if (entry.query) addChatMessage(entry.query, "user", time);
      if (entry.solution) addChatMessage(entry.solution, "mentor", time);
    });
  });
}

loadMentorChat();





function loadHistoricCard() {
  const emailBucket = getEmailBucket();
  if (!emailBucket) return;

  const container = document.getElementById("historicList");
  if (!container) return; // HTML protection

  container.innerHTML = `<p class="hint">Loading history...</p>`;

  db.ref(`requests/${emailBucket}`).once("value", (snap) => {
    container.innerHTML = ""; // clear

    if (!snap.exists()) {
      container.innerHTML = `<p class="hint">No historic data found.</p>`;
      return;
    }

    snap.forEach((child) => {
      const pid = child.key;
      const data = child.val();

      const type = data.productId || "Unknown";
      const created = new Date(data.createdOn).toLocaleString();

      const card = document.createElement("div");
      card.className = "history-item";
      card.innerHTML = `
        <div><strong>${pid}</strong></div>
        <div class="hint">Created on: ${created}</div>
      `;

      container.appendChild(card);
    });
  });
}

loadHistoricCard();
