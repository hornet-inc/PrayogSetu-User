document.addEventListener("DOMContentLoaded", () => {

  const loggedInEmail = sessionStorage.getItem("loggedInUserEmail");
  if (!loggedInEmail) {
      window.location.href = "login.html";
      return;
  }

  // Set username
  const username = loggedInEmail.split("@")[0].split(".")[0];
  const userNameEl = document.getElementById("userName");
  if (userNameEl) userNameEl.textContent = username.charAt(0).toUpperCase() + username.slice(1);

  const tableBody = document.getElementById("componentsTableBody");
  const searchBox = document.querySelector(".search-box");
  const refreshBtn = document.getElementById("refreshBtn");

  const DB_PATH = "components/stockLink";

  function showTableMessage(text, color = "#d6f7ff") {
    tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:${color}; padding:18px;">${text}</td></tr>`;
  }

  function convertSheetToCSV(url) {
    if (!url) return null;
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) return null;
    return `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
  }

  function populateTable(workbook) {
    try {
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      if (!rows.length) {
        showTableMessage("No rows found in sheet", "#ff6b6b");
        return;
      }

      tableBody.innerHTML = "";
      rows.forEach((row, i) => {
        const safe = v => (v === undefined ? "" : v);
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${i + 1}</td>
          <td>${safe(row["Component ID"])}</td>
          <td>${safe(row["Component Name"])}</td>
          <td>${safe(row["Total Quantity"])}</td>
          <td>${safe(row["Quantity Available"])}</td>
          <td>${safe(row["Description"])}</td>
          <td>${safe(row["Request Type"])}</td>
        `;
        tableBody.appendChild(tr);
      });

      if (searchBox && !searchBox._hasSearchHandler) {
        searchBox.addEventListener("input", () => {
          const q = searchBox.value.toLowerCase();
          tableBody.querySelectorAll("tr").forEach(row => {
            const match = Array.from(row.children).some(td =>
              td.textContent.toLowerCase().includes(q)
            );
            row.style.display = match ? "" : "none";
          });
        });
        searchBox._hasSearchHandler = true;
      }
    } catch (err) {
      console.error(err);
      showTableMessage("Error parsing sheet", "#ff6b6b");
    }
  }

  async function loadInventoryFromFirebase() {
    showTableMessage("Loading inventory...", "#bfe9ff");

    try {
      const snapshot = await firebase.database().ref(DB_PATH).once("value");
      const sheetURL = snapshot.val();

      if (!sheetURL) {
        showTableMessage("Updating inventory, please check after some time.", "#ffb86b");
        return;
      }

      const csvURL = convertSheetToCSV(sheetURL);
      const res = await fetch(csvURL);
      const csvText = await res.text();

      const workbook = XLSX.read(csvText, { type: "string" });
      populateTable(workbook);

    } catch (err) {
      console.error(err);
      showTableMessage("Failed to load inventory.", "#ff6b6b");
    }
  }

  if (refreshBtn) refreshBtn.addEventListener("click", loadInventoryFromFirebase);

  loadInventoryFromFirebase();

  // Logout
  const logoutBtn = document.querySelector(".logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      sessionStorage.clear();
      window.location.href = "login.html";
    });
  }

});
