document.addEventListener("DOMContentLoaded", () => {
  const cleanupButtons = document.querySelectorAll("[data-cleanup-sessions]");
  const messageEl = document.getElementById("sessionCleanupMessage");

  function setMessage(message, isError = false) {
    if (!messageEl) return;
    messageEl.textContent = message;
    messageEl.style.display = "block";
    messageEl.style.color = isError ? "#b00020" : "#0a7a2f";
  }

  function clearMessage() {
    if (!messageEl) return;
    messageEl.textContent = "";
    messageEl.style.display = "none";
  }

  async function runCleanup(button) {
    const originalText = button.textContent;

    try {
      clearMessage();
      button.disabled = true;
      button.textContent = "Cleaning...";

      const response = await window.DDAuth.apiFetch("/api/admin/cleanup-sessions", {
        method: "POST"
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to clean expired sessions.");
      }

      const deletedCount = Number(data.deleted_sessions || 0);
      setMessage(
        `Expired sessions cleaned up successfully. Removed ${deletedCount} expired session${deletedCount === 1 ? "" : "s"}.`
      );

      document.dispatchEvent(new CustomEvent("dd:admin-data-changed", {
        detail: {
          type: "sessions-cleaned",
          deleted_sessions: deletedCount
        }
      }));
    } catch (error) {
      setMessage(error.message || "Failed to clean expired sessions.", true);
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  }

  cleanupButtons.forEach(button => {
    button.addEventListener("click", async () => {
      await runCleanup(button);
    });
  });
});
