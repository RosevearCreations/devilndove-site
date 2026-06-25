# Post-Deploy Smoke Test — Build 195

After migration/deploy: test `/api/auth/login`, create a blank-SKU temporary product, delete it through the guarded flow, create another to verify System # does not reuse, edit one inventory description, then run `/admin/deployment-preflight/`. Full steps: `BUILD195_PRODUCT_LIFECYCLE_INVENTORY_GUIDE.md`.


## Build 196 note

Use `BUILD196_PRODUCT_CORRECTION_MATERIAL_RETURN_GUIDE.md` to test visible product correction, reservation release, physical raw-supply return, archive fallback, and inventory name-under-image layout after deployment.
