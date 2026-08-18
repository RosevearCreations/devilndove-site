# Build 273 Deploy Checklist

1. Keep the production D1 backup / Build 269 migration state already established. **Do not run a new Build 273 migration; none exists.**
2. Deploy Build 273 and hard-refresh admin pages.
3. Open `/admin/creative-process/`, select Gray Hair, type a few characters into Inventory search and confirm the correct existing Inventory item remains selectable.
4. Review Automatic Output Blueprint. Confirm CAIP counts and Content Studio package/deliverable counts load without changing output status automatically.
5. Open `/admin/content-studio/?creative_project_id=6` (for Gray Hair Creative Process ID 6). Gray Hair should be visible in **Creative Process projects**.
6. Use **Create / refresh package from this project**. Do not create another Gray Hair Creative Project.
7. Confirm the resulting package shows the existing CAIP link/source-reference count. Private raw video may show a visual placeholder because it intentionally has no public URL.
8. Return to CAIP and continue rights/evidence/story review. Nothing in this deployment auto-renders or auto-publishes media.
