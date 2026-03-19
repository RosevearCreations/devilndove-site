// File: /public/js/member-downloads.js

document.addEventListener("DOMContentLoaded", () => {
  const refreshButton = document.getElementById("refreshMemberDownloadsButton");
  const messageEl = document.getElementById("memberDownloadsMessage");
  const emptyEl = document.getElementById("memberDownloadsEmpty");
  const listEl = document.getElementById("memberDownloadsList");

  if (!listEl || !window.DDAuth) return;

  let isLoading = false;
  let hasMemberAccess = false;
  let currentUser = null;
  let allDownloads = [];

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatDate(value) {
    if (!value) return "—";

    const raw = String(value).trim();
    const parsed = new Date(raw);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleString();
    }

    const fallback = new Date(raw.replace(" ", "T") + "Z");
    if (!Number.isNaN(fallback.getTime())) {
      return fallback.toLocaleString();
    }

    return raw;
  }

  function titleCase(value) {
    const text = String(value || "").trim();
    if (!text) return "—";

    return text
      .replaceAll("_", " ")
      .replaceAll("-", " ")
      .replace(/\b\w/g, (ch) => ch.toUpperCase());
  }

  function setMessage(message, isError = false) {
    if (!messageEl) return;

    messageEl.textContent = message;
    messageEl.style.display = message ? "block" : "none";
    messageEl.style.color = isError ? "#b00020" : "";
  }

  function renderDownloads(downloads) {
    const safeDownloads = Array.isArray(downloads) ? downloads : [];

    if (emptyEl) {
      emptyEl.style.display = safeDownloads.length ? "none" : "block";
    }

    if (!safeDownloads.length) {
      listEl.innerHTML = "";
      return;
    }

    listEl.innerHTML = safeDownloads.map((item) => {
      const title =
        item.title ||
        item.product_name ||
        item.file_name ||
        "Download";

      const status = titleCase(item.access_status || item.status || "available");
      const orderNumber = item.order_number || "—";
      const expiresAt = item.expires_at ? formatDate(item.expires_at) : "No expiry";
      const fileUrl = String(item.file_url || "").trim();

      return `
        <div class="card" style="margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
            <div>
              <div style="font-weight:700">${escapeHtml(title)}</div>
              <div class="small">Order: ${escapeHtml(orderNumber)}</div>
              <div class="small">Status: ${escapeHtml(status)}</div>
              <div class="small">Available Until: ${escapeHtml(expiresAt)}</div>
            </div>

            <div>
              ${
                fileUrl
                  ? `<a class="btn" href="${escapeHtml(fileUrl)}" target="_blank" rel="noopener noreferrer">Open</a>`
                  : `<button class="btn" type="button" disabled>Unavailable</button>`
              }
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  async function fetchDownloads() {
    const response = await window.DDAuth.apiFetch("/api/member/downloads", {
      method: "GET"
    });

    const data = await response.json();

    if (!response.ok || !data?.ok) {
      throw new Error(data?.error || "Failed to load your downloads.");
    }

    return Array.isArray(data.downloads) ? data.downloads : [];
  }

  async function loadDownloads() {
    if (isLoading || !hasMemberAccess || !currentUser) return;

    isLoading = true;
    const originalText = refreshButton?.textContent || "Refresh Downloads";

    try {
      setMessage("Loading your downloads...");

      if (refreshButton) {
        refreshButton.disabled = true;
        refreshButton.textContent = "Loading...";
      }

      allDownloads = await fetchDownloads();
      renderDownloads(allDownloads);
      setMessage(`Loaded ${allDownloads.length} download${allDownloads.length === 1 ? "" : "s"}.`);
    } catch (error) {
      allDownloads = [];
      renderDownloads([]);
      setMessage(error.message || "Failed to load your downloads.", true);
    } finally {
      isLoading = false;

      if (refreshButton) {
        refreshButton.disabled = false;
        refreshButton.textContent = originalText;
      }
    }
  }

  if (refreshButton) {
    refreshButton.addEventListener("click", async () => {
      await loadDownloads();
    });
  }

  document.addEventListener("dd:member-access-ready", async (event) => {
    hasMemberAccess = !!event?.detail?.ok;
    currentUser = hasMemberAccess ? (event?.detail?.user || currentUser) : null;

    if (!hasMemberAccess) {
      allDownloads = [];
      renderDownloads([]);
      return;
    }

    await loadDownloads();
  });

  document.addEventListener("dd:members-ready", async (event) => {
    if (!event?.detail?.ok) return;

    hasMemberAccess = true;
    currentUser = event.detail.user || currentUser;
    await loadDownloads();
  });

  renderDownloads([]);
});
