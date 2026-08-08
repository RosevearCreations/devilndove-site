# Build 242 Validation

## Production failure reproduced from code
The manual inventory-create statement had 26 SQL placeholders but supplied 27 bound values. D1 therefore threw on the POST write. Because the create path had no error boundary, Cloudflare returned an HTML 500 response; the browser then attempted `response.json()`, which caused the visible `JSON.parse: unexpected character at line 1 column 1` symptom.

## Repair
- Manual inventory create now has 27 placeholders for 27 bound values.
- Inventory schema/create failures return JSON with a bounded diagnostic and error code.
- Runtime incident capture records the failed inventory operation without storing credentials.
- Client-side save handling accepts JSON success/error responses and safely reports HTML/non-JSON failures.

## Schema boundary
Build 242 introduces no new D1 tables or columns. Build 241 remains the current migration boundary. Aggregate schema files and the schema reference are marked/synchronized for Build 242.

## Required live verification
1. Deploy Build 242.
2. Open `/admin/inventory-operations/#siteInventoryForm`.
3. Pull an Amazon item, review the populated data, enter the actual cost/quantity and save it.
4. Confirm the POST returns JSON 201 and the new inventory row remains editable after refresh.
5. Confirm movement history and cost history show the create operation.
6. If a server error occurs, confirm the UI now shows HTTP status/Ray ID and the admin runtime incident queue records the structured failure.
