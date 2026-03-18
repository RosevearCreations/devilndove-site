// File: /public/js/admin-self-protect.js

document.addEventListener("DOMContentLoaded", () => {
  const accessMessageEl = document.getElementById("adminAccessMessage");
  const adminSectionIds = [
    "usersSection",
    "accessTiersSection",
    "productsSection",
    "ordersSection"
  ];

  function setAccessMessage(message, isError = false) {
    if (!accessMessageEl) return;

    accessMessageEl.textContent = message;
    accessMessageEl.style.display = message ? "block" : "none";
    accessMessageEl.style.color = isError ? "#b00020" : "";
  }

  function hideAdminSections() {
    adminSectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.style.display = "none";
      }
    });
  }

  function showAdminSections() {
    adminSectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.style.display = "";
      }
    });
  }

  function safeRedirect(path) {
    window.location.href = path;
  }

  async function protectAdminPage() {
    hideAdminSections();

    if (!window.DDAuth) {
      setAccessMessage("Authentication tools are not available.", true);
      return;
    }

    if (!window.DDAuth.isLoggedIn()) {
      setAccessMessage("You must be logged in as an admin to access this page.", true);

      setTimeout(() => {
        safeRedirect("/login/");
      }, 900);

      return;
    }

    setAccessMessage("Checking admin access...");

    try {
      const me = await window.DDAuth.fetchMe();
      const role = String(me?.role || "").trim().toLowerCase();
      const isActive =
        me?.is_active === true ||
        Number(me?.is_active || 0) === 1;

      if (!isActive) {
        setAccessMessage("This account is inactive.", true);

        setTimeout(() => {
          safeRedirect("/");
        }, 1200);

        return;
      }

      if (role !== "admin") {
        setAccessMessage("Admin access is required for this page.", true);

        setTimeout(() => {
          safeRedirect("/members/");
        }, 1200);

        return;
      }

      showAdminSections();
      setAccessMessage("");
    } catch (error) {
      setAccessMessage("Your session could not be verified. Please log in again.", true);

      if (window.DDAuth.logout) {
        try {
          await window.DDAuth.logout();
        } catch {
          // ignore logout cleanup failure
        }
      }

      setTimeout(() => {
        safeRedirect("/login/");
      }, 1200);
    }
  }

  protectAdminPage();
});
