// File: /public/js/admin-tier-policy.js
// Brief description: Admin editor for Bronze/Silver/Gold member-facing tier descriptions and benefits.
(function () {
  const mountEl = document.getElementById("adminTierPolicyMount");
  if (!mountEl || !window.DDAuth) return;

  function esc(value) {
    return String(value ?? "").replace(/[&<>\"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
  }

  function setMessage(message, isError = false) {
    const el = document.getElementById("tierPolicyMessage");
    if (!el) return;
    el.style.display = message ? "block" : "none";
    el.textContent = message || "";
    el.style.color = isError ? "#b91c1c" : "";
  }

  function renderShell() {
    mountEl.innerHTML = `
      <div class="card">
        <h3 style="margin-top:0">Tier Policy</h3>
        <p class="small" style="margin-top:0">Control what Bronze, Silver, and Gold members see in their account area. Keep benefits simple now so the system can grow later.</p>
        <div id="tierPolicyMessage" class="small" style="display:none;margin-bottom:12px"></div>
        <div id="tierPolicyList" class="grid cols-3" style="gap:12px"></div>
      </div>`;
  }

  async function load() {
    try {
      const res = await window.DDAuth.apiFetch("/api/admin/tier-policies");
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed to load tier policies.");
      const rows = Array.isArray(data.tier_policies) ? data.tier_policies : [];
      const list = document.getElementById("tierPolicyList");
      if (!list) return;
      list.innerHTML = rows.map((row) => {
        let benefits = [];
        try {
          const parsed = JSON.parse(row.benefits_json || "[]");
          benefits = Array.isArray(parsed) ? parsed : [];
        } catch {
          benefits = [];
        }
        return `
          <form class="card tier-policy-form" data-code="${esc(row.access_tier_code)}" style="margin:0;border-top:4px solid ${esc(row.badge_color || "#444")}">
            <div style="font-weight:700;margin-bottom:8px">${esc(row.title || row.access_tier_code || "Tier")}</div>
            <label class="small">Title</label>
            <input name="title" type="text" value="${esc(row.title || "")}" />
            <label class="small">Short Description</label>
            <input name="short_description" type="text" value="${esc(row.short_description || "")}" />
            <label class="small">Benefits (one per line)</label>
            <textarea name="benefits_text" rows="6">${esc(benefits.join("\n"))}</textarea>
            <div class="grid cols-2" style="gap:10px">
              <div>
                <label class="small">Badge Color</label>
                <input name="badge_color" type="text" value="${esc(row.badge_color || "")}" />
              </div>
              <div>
                <label class="small">Sort Order</label>
                <input name="sort_order" type="number" value="${esc(row.sort_order || 0)}" />
              </div>
            </div>
            <label class="small" style="display:flex;gap:8px;align-items:center">
              <input name="is_visible" type="checkbox" ${Number(row.is_visible || 0) === 1 ? "checked" : ""}/> Visible to members
            </label>
            <button class="btn" type="submit">Save Policy</button>
          </form>`;
      }).join("");
      list.querySelectorAll(".tier-policy-form").forEach((form) => form.addEventListener("submit", save));
    } catch (error) {
      setMessage(error.message || "Failed to load tier policies.", true);
    }
  }

  async function save(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const code = form.getAttribute("data-code") || "";
    const payload = Object.fromEntries(new FormData(form).entries());
    payload.access_tier_code = code;
    payload.is_visible = form.querySelector('input[name="is_visible"]')?.checked ? 1 : 0;
    try {
      setMessage("Saving tier policy...");
      const res = await window.DDAuth.apiFetch("/api/admin/tier-policies", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed to save tier policy.");
      setMessage(`Saved ${code.toUpperCase()} policy.`);
      await load();
    } catch (error) {
      setMessage(error.message || "Failed to save tier policy.", true);
    }
  }

  renderShell();
  load();
})();
