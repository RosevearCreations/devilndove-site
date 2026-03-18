// File: /public/js/admin.js

document.addEventListener("DOMContentLoaded", () => {
  const footerEl = document.querySelector(".footer");
  const adminAccessMessageEl = document.getElementById("adminAccessMessage");

  let adminBooted = false;

  function setFooter() {
    if (!footerEl) return;
    footerEl.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center">
        <div>© <span id="adminFooterYear"></span> Devil n Dove</div>
        <div class="small">Admin Dashboard • Store • Orders • Payments • Security</div>
      </div>
    `;

    const yearEl = document.getElementById("adminFooterYear");
    if (yearEl) {
      yearEl.textContent = String(new Date().getFullYear());
    }
  }

  function setAccessMessage(message, isError = false) {
    if (!adminAccessMessageEl) return;

    adminAccessMessageEl.textContent = message;
    adminAccessMessageEl.style.display = message ? "block" : "none";
    adminAccessMessageEl.style.color = isError ? "#b00020" : "";
  }

  function getAdminSectionIds() {
    return [
      "usersSection",
      "accessTiersSection",
      "productsSection",
      "ordersSection"
    ];
  }

  function setAdminSectionsVisibility(isVisible) {
    getAdminSectionIds().forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.style.display = isVisible ? "" : "none";
    });
  }

  function notifyAdminReady(detail = {}) {
    document.dispatchEvent(new CustomEvent("dd:admin-ready", { detail }));
  }

  async function verifyAdmin() {
    if (!window.DDAuth) {
      throw new Error("Authentication tools are not available.");
    }

    if (!window.DDAuth.isLoggedIn()) {
      throw new Error("You must be logged in as an admin.");
    }

    const me = await window.DDAuth.fetchMe();
    const role = String(me?.role || "").trim().toLowerCase();
    const isActive = me?.is_active === true || Number(me?.is_active || 0) === 1;

    if (!isActive) {
      throw new Error("This account is inactive.");
    }

    if (role !== "admin") {
      throw new Error("Admin access is required.");
    }

    return me;
  }

  async function bootAdminPage() {
    if (adminBooted) return;
    adminBooted = true;

    setFooter();
    setAdminSectionsVisibility(false);

    try {
      const me = await verifyAdmin();

      setAdminSectionsVisibility(true);
      setAccessMessage("");

      notifyAdminReady({
        ok: true,
        user: {
          user_id: me?.user_id ?? null,
          email: me?.email ?? "",
          display_name: me?.display_name ?? "",
          role: me?.role ?? ""
        }
      });
    } catch (error) {
      setAdminSectionsVisibility(false);
      setAccessMessage(error.message || "Admin access could not be verified.", true);

      notifyAdminReady({
        ok: false,
        error: error.message || "Admin access could not be verified."
      });
    }
  }

  document.addEventListener("dd:auth-changed", async () => {
    adminBooted = false;
    await bootAdminPage();
  });

  document.addEventListener("dd:admin-refresh", async () => {
    adminBooted = false;
    await bootAdminPage();
  });

  bootAdminPage();
});
