// File: /public/js/admin-access-tiers.js

document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.getElementById("adminUsersTableBody");

  if (!tableBody || !window.DDAuth || !window.DDAuth.isLoggedIn()) return;

  let availableTiers = [];
  let modalEl = null;
  let currentUserId = null;

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function ensureModal() {
    if (modalEl) return modalEl;

    modalEl = document.createElement("div");
    modalEl.id = "accessTierModal";
    modalEl.style.display = "none";
    modalEl.style.position = "fixed";
    modalEl.style.inset = "0";
    modalEl.style.background = "rgba(0,0,0,0.55)";
    modalEl.style.zIndex = "9999";
    modalEl.innerHTML = `
      <div style="max-width:760px;margin:40px auto;padding:0 16px;">
        <div class="card" style="max-height:85vh;overflow:auto">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
            <h2 style="margin:0">Access Tiers</h2>
            <button class="btn" type="button" id="closeAccessTierModal">Close</button>
          </div>

          <p class="small" id="accessTierUserLabel" style="margin-top:10px"></p>

          <div class="card" style="margin-top:14px">
            <h3 style="margin-top:0">Assign Tier</h3>
            <div class="grid" style="gap:12px">
              <div>
                <label class="small" for="assignAccessTierSelect">Access Tier</label>
                <select id="assignAccessTierSelect"></select>
                <div class="small" style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">
                  <span style="opacity:.85">Quick assign:</span>
                  <button class="btn" type="button" data-quick-tier-code="customer_bronze">Bronze</button>
                  <button class="btn" type="button" data-quick-tier-code="customer_silver">Silver</button>
                  <button class="btn" type="button" data-quick-tier-code="customer_gold">Gold</button>
                </div>
              </div>

              <div>
                <label class="small" for="assignAccessTierExpiresAt">Expires At (optional)</label>
                <input id="assignAccessTierExpiresAt" type="text" placeholder="YYYY-MM-DD or leave blank" />
              </div>

              <div>
                <label class="small" for="assignAccessTierNotes">Notes (optional)</label>
                <input id="assignAccessTierNotes" type="text" />
              </div>

              <div>
                <button class="btn" type="button" id="assignAccessTierButton">Assign Tier</button>
              </div>

              <div id="accessTierAssignMessage" class="small" style="display:none"></div>
            </div>
          </div>

          <div class="card" style="margin-top:14px">
            <h3 style="margin-top:0">Assigned Tiers</h3>
            <div id="accessTierLoading" class="small">Loading access tiers...</div>
            <div id="accessTierError" class="small" style="display:none;color:#b00020"></div>
            <div id="accessTierEmpty" class="small" style="display:none">No access tiers assigned.</div>

            <div style="overflow:auto">
              <table style="width:100%;border-collapse:collapse">
                <thead>
                  <tr>
                    <th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Tier</th>
                    <th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Code</th>
                    <th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Granted</th>
                    <th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Expires</th>
                    <th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Notes</th>
                    <th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Action</th>
                  </tr>
                </thead>
                <tbody id="accessTierTableBody"></tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modalEl);

    modalEl.querySelector("#closeAccessTierModal").addEventListener("click", () => {
      hideModal();
    });

    modalEl.addEventListener("click", (event) => {
      if (event.target === modalEl) {
        hideModal();
      }
    });

    modalEl.querySelector("#assignAccessTierButton").addEventListener("click", async () => {
      await assignTier();
    });
    modalEl.querySelectorAll('[data-quick-tier-code]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        clearAssignMessage();
        const code = btn.getAttribute('data-quick-tier-code');
        const tierId = findTierIdByCode(code);
        const select = document.getElementById('assignAccessTierSelect');
        if (select && tierId) select.value = String(tierId);
        await assignTier();
      });
    });


    modalEl.querySelector("#accessTierTableBody").addEventListener("click", async (event) => {
      const button = event.target.closest("[data-remove-user-access-tier-id]");
      if (!button) return;

      const userAccessTierId = Number(button.getAttribute("data-remove-user-access-tier-id"));
      if (!userAccessTierId) return;

      const confirmed = window.confirm("Remove this access tier from the user?");
      if (!confirmed) return;

      await removeTier(userAccessTierId, button);
    });

    return modalEl;
  }

  function showModal() {
    ensureModal();
    modalEl.style.display = "block";
  }

  function hideModal() {
    if (!modalEl) return;
    modalEl.style.display = "none";
  }

  function setAssignMessage(message, isError = false) {
    const el = document.getElementById("accessTierAssignMessage");
    if (!el) return;
    el.textContent = message;
    el.style.display = "block";
    el.style.color = isError ? "#b00020" : "#0a7a2f";
  }

  function clearAssignMessage() {
    const el = document.getElementById("accessTierAssignMessage");
    if (!el) return;
    el.textContent = "";
    el.style.display = "none";
  }


  function findTierIdByCode(code) {
    const target = String(code || '').toLowerCase();
    const tier = availableTiers.find((t) => String(t.code || '').toLowerCase() === target);
    return tier ? Number(tier.access_tier_id || 0) : 0;
  }

  function formatDate(value) {
    if (!value) return "—";
    const d = new Date(String(value).replace(" ", "T") + "Z");
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString();
  }

  async function loadAvailableTiers() {
    const response = await window.DDAuth.apiFetch("/api/admin/access-tiers", {
      method: "GET"
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.error || "Failed to load access tiers.");
    }

    availableTiers = Array.isArray(data.access_tiers) ? data.access_tiers : [];

    const select = document.getElementById("assignAccessTierSelect");
    if (select) {
      select.innerHTML = `
        <option value="">Select access tier</option>
        ${availableTiers.map(tier => `
          <option value="${tier.access_tier_id}">
            ${escapeHtml(tier.name)} (${escapeHtml(tier.code)})
          </option>
        `).join("")}
      `;
    }
  }

  async function loadUserTiers(userId) {
    const loadingEl = document.getElementById("accessTierLoading");
    const errorEl = document.getElementById("accessTierError");
    const emptyEl = document.getElementById("accessTierEmpty");
    const bodyEl = document.getElementById("accessTierTableBody");

    if (loadingEl) loadingEl.style.display = "";
    if (errorEl) errorEl.style.display = "none";
    if (emptyEl) emptyEl.style.display = "none";
    if (bodyEl) bodyEl.innerHTML = "";

    try {
      const response = await window.DDAuth.apiFetch(`/api/admin/user-access-tiers?user_id=${encodeURIComponent(userId)}`, {
        method: "GET"
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to load user access tiers.");
      }

      const user = data.user || {};
      const tiers = Array.isArray(data.access_tiers) ? data.access_tiers : [];

      const userLabel = document.getElementById("accessTierUserLabel");
      if (userLabel) {
        userLabel.textContent = `User: ${user.display_name || user.email || `#${user.user_id}`}`;
      }

      if (!tiers.length) {
        if (emptyEl) emptyEl.style.display = "";
        return;
      }

      if (bodyEl) {
        bodyEl.innerHTML = tiers.map(tier => `
          <tr>
            <td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(tier.name || "")}</td>
            <td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(tier.code || "")}</td>
            <td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(formatDate(tier.granted_at))}</td>
            <td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(formatDate(tier.expires_at))}</td>
            <td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(tier.notes || "")}</td>
            <td style="padding:8px;border-bottom:1px solid #ddd">
              <button
                class="btn"
                type="button"
                data-remove-user-access-tier-id="${tier.user_access_tier_id}"
              >
                Remove
              </button>
            </td>
          </tr>
        `).join("");
      }
    } catch (error) {
      if (errorEl) {
        errorEl.textContent = error.message || "Failed to load user access tiers.";
        errorEl.style.display = "";
      }
    } finally {
      if (loadingEl) loadingEl.style.display = "none";
    }
  }

  async function assignTier() {
    clearAssignMessage();

    if (!currentUserId) {
      setAssignMessage("No user selected.", true);
      return;
    }

    const select = document.getElementById("assignAccessTierSelect");
    const expiresAt = document.getElementById("assignAccessTierExpiresAt");
    const notes = document.getElementById("assignAccessTierNotes");

    const access_tier_id = Number(select?.value || 0);
    const expires_at = String(expiresAt?.value || "").trim();
    const notesValue = String(notes?.value || "").trim();

    if (!access_tier_id) {
      setAssignMessage("Please select an access tier.", true);
      return;
    }

    try {
      const response = await window.DDAuth.apiFetch("/api/admin/assign-user-access-tier", {
        method: "POST",
        body: JSON.stringify({
          user_id: currentUserId,
          access_tier_id,
          expires_at,
          notes: notesValue
        })
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to assign access tier.");
      }

      setAssignMessage("Access tier assigned successfully.");
      if (select) select.value = "";
      if (expiresAt) expiresAt.value = "";
      if (notes) notes.value = "";

      await loadUserTiers(currentUserId);
    } catch (error) {
      setAssignMessage(error.message || "Failed to assign access tier.", true);
    }
  }

  async function removeTier(userAccessTierId, button) {
    const originalText = button.textContent;

    try {
      button.disabled = true;
      button.textContent = "Removing...";

      const response = await window.DDAuth.apiFetch("/api/admin/remove-user-access-tier", {
        method: "POST",
        body: JSON.stringify({
          user_access_tier_id: userAccessTierId
        })
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to remove access tier.");
      }

      await loadUserTiers(currentUserId);
    } catch (error) {
      window.alert(error.message || "Failed to remove access tier.");
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  }

  tableBody.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-manage-access-tiers-user-id]");
    if (!button) return;

    const userId = Number(button.getAttribute("data-manage-access-tiers-user-id"));
    if (!userId) return;

    currentUserId = userId;
    showModal();

    try {
      await loadAvailableTiers();
      await loadUserTiers(userId);
      clearAssignMessage();
    } catch (error) {
      window.alert(error.message || "Failed to load access tier manager.");
    }
  });
});
