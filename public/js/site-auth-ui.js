document.addEventListener("DOMContentLoaded", async () => {
  const loginOnlyEls = document.querySelectorAll("[data-show-when-logged-out]");
  const memberOnlyEls = document.querySelectorAll("[data-show-when-logged-in]");
  const adminOnlyEls = document.querySelectorAll("[data-show-when-admin]");
  const userNameEls = document.querySelectorAll("[data-nav-user-name]");
  const logoutButtons = document.querySelectorAll("[data-nav-logout]");

  function show(elements) {
    elements.forEach(el => {
      el.style.display = "";
    });
  }

  function hide(elements) {
    elements.forEach(el => {
      el.style.display = "none";
    });
  }

  function setUserName(user) {
    const name = user?.display_name?.trim() || user?.email || "Member";
    userNameEls.forEach(el => {
      el.textContent = name;
    });
  }

  async function applyAuthState() {
    if (!window.DDAuth || !window.DDAuth.isLoggedIn()) {
      show(loginOnlyEls);
      hide(memberOnlyEls);
      hide(adminOnlyEls);
      return;
    }

    try {
      const user = await window.DDAuth.fetchMe();

      hide(loginOnlyEls);
      show(memberOnlyEls);
      setUserName(user);

      if (user?.role === "admin") {
        show(adminOnlyEls);
      } else {
        hide(adminOnlyEls);
      }
    } catch (error) {
      window.DDAuth.clearAuth();
      show(loginOnlyEls);
      hide(memberOnlyEls);
      hide(adminOnlyEls);
    }
  }

  logoutButtons.forEach(button => {
    button.addEventListener("click", async () => {
      const originalText = button.textContent;

      try {
        button.disabled = true;
        button.textContent = "Logging out...";
        await window.DDAuth.logout();
        window.location.href = "/login/";
      } catch (error) {
        button.disabled = false;
        button.textContent = originalText;
        alert(error.message || "Logout failed.");
      }
    });
  });

  await applyAuthState();
});
