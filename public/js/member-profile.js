// File: /public/js/member-profile.js
// Brief description: Adds a member-facing profile editor for contact details, address,
// and communication preferences while showing verification state and assigned tiers.

document.addEventListener("DOMContentLoaded", () => {
  const mountEl = document.getElementById("memberProfileMount");
  if (!mountEl || !window.DDAuth) return;

  let hasRendered = false;

  function setMessage(message, isError = false) {
    const el = document.getElementById("memberProfileMessage");
    if (!el) return;
    el.textContent = message;
    el.style.display = message ? "block" : "none";
    el.style.color = isError ? "#b00020" : "#0a7a2f";
  }

  function renderUi() {
    if (hasRendered) return;
    hasRendered = true;
    mountEl.innerHTML = `
      <div class="card" style="margin-top:18px"><h3 style="margin-top:0">Contact Profile</h3><p class="small" style="margin-top:0">Keep your address, phone, and contact preferences current.</p><div id="memberProfileMessage" class="small" style="display:none;margin-bottom:12px"></div><form id="memberProfileForm" class="grid" style="gap:12px"><div class="grid cols-3" style="gap:12px"><div><label class="small" for="mpPreferredName">Preferred Name</label><input id="mpPreferredName" type="text" /></div><div><label class="small" for="mpCompanyName">Company</label><input id="mpCompanyName" type="text" /></div><div><label class="small" for="mpPhone">Phone</label><input id="mpPhone" type="text" /></div></div><div class="grid cols-3" style="gap:12px"><div><label class="small" for="mpPreferredContactMethod">Preferred Contact</label><select id="mpPreferredContactMethod"><option value="email">Email</option><option value="phone">Phone</option><option value="text">Text</option><option value="mail">Mail</option><option value="none">Do Not Contact</option></select></div><label class="small" style="display:flex;gap:8px;align-items:flex-start"><input id="mpMarketingOptIn" type="checkbox" /><span>Marketing Opt-In</span></label><label class="small" style="display:flex;gap:8px;align-items:flex-start"><input id="mpOrderUpdatesOptIn" type="checkbox" checked /><span>Order Updates Opt-In</span></label></div><div class="small">Verification: <span id="mpVerificationStatus">Email ✕ • Phone ✕</span></div><div class="small">Assigned tiers: <span id="mpTierCodes">—</span></div><div id="mpTierPolicies" class="grid cols-3" style="gap:10px"></div><div><label class="small" for="mpContactNotes">Contact Notes</label><input id="mpContactNotes" type="text" placeholder="Optional delivery/contact preference notes" /></div><div class="card"><h4 style="margin-top:0">Address</h4><div class="grid" style="gap:12px"><div><label class="small" for="mpAddress1">Address 1</label><input id="mpAddress1" type="text" /></div><div><label class="small" for="mpAddress2">Address 2</label><input id="mpAddress2" type="text" /></div><div class="grid cols-4" style="gap:12px"><div><label class="small" for="mpCity">City</label><input id="mpCity" type="text" /></div><div><label class="small" for="mpProvince">Province/State</label><input id="mpProvince" type="text" /></div><div><label class="small" for="mpPostal">Postal Code</label><input id="mpPostal" type="text" /></div><div><label class="small" for="mpCountry">Country</label><input id="mpCountry" type="text" /></div></div></div></div><div><button class="btn" type="submit" id="saveMemberProfileButton">Save Profile</button></div></form></div>`;
    document.getElementById("memberProfileForm")?.addEventListener("submit", handleSubmit);
  }

  function fill(payload) {
    const profile = payload?.profile || {};
    const map = { mpPreferredName: profile.preferred_name || "", mpCompanyName: profile.company_name || "", mpPhone: profile.phone || "", mpPreferredContactMethod: profile.preferred_contact_method || "email", mpContactNotes: profile.contact_notes || "", mpAddress1: profile.address_line1 || "", mpAddress2: profile.address_line2 || "", mpCity: profile.city || "", mpProvince: profile.province || "", mpPostal: profile.postal_code || "", mpCountry: profile.country || "" };
    Object.entries(map).forEach(([id, value]) => { const el = document.getElementById(id); if (el) el.value = value; });
    const mo = document.getElementById("mpMarketingOptIn"); if (mo) mo.checked = Number(profile.marketing_opt_in || 0) === 1;
    const ou = document.getElementById("mpOrderUpdatesOptIn"); if (ou) ou.checked = Number(profile.order_updates_opt_in ?? 1) === 1;
    const vs = document.getElementById("mpVerificationStatus"); if (vs) vs.textContent = `${Number(profile.email_verified || 0) === 1 ? "Email ✓" : "Email ✕"} • ${Number(profile.phone_verified || 0) === 1 ? "Phone ✓" : "Phone ✕"}`;
    
const tiers = document.getElementById("mpTierCodes"); if (tiers) tiers.textContent = Array.isArray(profile.access_tier_codes) && profile.access_tier_codes.length ? profile.access_tier_codes.join(", ") : "No tiers assigned.";
const policyMount = document.getElementById("mpTierPolicies");
if (policyMount) {
  const policies = Array.isArray(profile.tier_policies) ? profile.tier_policies : [];
  policyMount.innerHTML = policies.length ? policies.map((policy) => `
    <div class="card" style="margin:0;border-top:4px solid ${policy.badge_color || '#444'}">
      <div style="font-weight:700">${policy.title || policy.access_tier_code || ''}</div>
      <div class="small" style="margin:4px 0 8px 0">${policy.short_description || ''}</div>
      <ul class="small" style="margin:0;padding-left:18px">${(Array.isArray(policy.benefits) ? policy.benefits : []).map((benefit) => `<li>${benefit}</li>`).join('')}</ul>
    </div>`).join('') : '<div class="small">No tier policy details yet.</div>';
}

  }

  async function loadProfile() {
    const response = await window.DDAuth.apiFetch("/api/member/profile", { method: "GET" });
    const data = await response.json();
    if (!response.ok || !data?.ok) throw new Error(data?.error || "Failed to load profile.");
    return data;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const button = document.getElementById("saveMemberProfileButton");
    const originalText = button?.textContent || "Save Profile";
    const payload = {
      preferred_name: document.getElementById("mpPreferredName")?.value || "",
      company_name: document.getElementById("mpCompanyName")?.value || "",
      phone: document.getElementById("mpPhone")?.value || "",
      preferred_contact_method: document.getElementById("mpPreferredContactMethod")?.value || "email",
      contact_notes: document.getElementById("mpContactNotes")?.value || "",
      marketing_opt_in: !!document.getElementById("mpMarketingOptIn")?.checked,
      order_updates_opt_in: !!document.getElementById("mpOrderUpdatesOptIn")?.checked,
      address_line1: document.getElementById("mpAddress1")?.value || "",
      address_line2: document.getElementById("mpAddress2")?.value || "",
      city: document.getElementById("mpCity")?.value || "",
      province: document.getElementById("mpProvince")?.value || "",
      postal_code: document.getElementById("mpPostal")?.value || "",
      country: document.getElementById("mpCountry")?.value || ""
    };
    try {
      setMessage("Saving profile...");
      if (button) { button.disabled = true; button.textContent = "Saving..."; }
      const response = await window.DDAuth.apiFetch("/api/member/profile", { method: "POST", body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || "Failed to save profile.");
      fill(data);
      setMessage("Profile saved successfully.");
    } catch (error) {
      setMessage(error.message || "Failed to save profile.", true);
    } finally {
      if (button) { button.disabled = false; button.textContent = originalText; }
    }
  }

  async function init() {
    renderUi();
    try {
      setMessage("Loading profile...");
      fill(await loadProfile());
      setMessage("");
    } catch (error) {
      setMessage(error.message || "Failed to load profile.", true);
    }
  }

  document.addEventListener("dd:members-ready", async (event) => { if (!event?.detail?.ok) return; await init(); });
});
