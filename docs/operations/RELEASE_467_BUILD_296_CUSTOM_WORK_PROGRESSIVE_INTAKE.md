# Release 467 Build 296 — Custom Work Progressive Intake

Build 296 turns the existing Custom Work request into an outcome-first conversation without creating another intake, Product, media, manufacturing, or publishing authority.

The public flow now starts with **What would you like made?**, then **What matters most?**, **Anything we should know?**, and **How can we reach you?**. Only the project description, name, email, and permission to contact are required. Reference images and links remain optional; technical material/process/fit questions are behind progressive disclosure and can open when a prototype, batch, repair, supplied item, or explicit process preference makes them useful.

Customer-supplied-item identity, ownership, condition notes, and private condition photography continue to use the existing Build 216 records and upload authority. The public API remains the existing `custom_requests` intake from Build 210 and performs no request-time DDL, order creation, quote creation, stock reservation, provider action, payment, or production start.

Draft recovery is tab-local through `sessionStorage`; file selections and contact consent are never saved into the draft. The customer can clear the draft at any time. Existing site analytics record only intake start, draft restore, optional technical disclosure, and successful submission events; there is no forced step gate or dark pattern.

Accepted Custom Work may continue into the existing manufacturing triage / Hybrid Creative Project path, and an owner-selected project may later use Creative Process → CAIP → Content Studio. Nothing in Build 296 automatically documents, publishes, or promotes a customer request.

Build 295 is the exact predecessor: Development `653a1952cee1a78aa131180fc798a45f4de344b0`, Production `9da8d3c7dc6ace186de0d69141e19fed998f5ddf`, shared tree `7fc2c8c8147acd76b3ab64a8c62a96da5ac55ce3`. Production proofs are Pages `36589115627` and Live Resource Integrity `36589247196`.

Build 296 is schema-neutral and code-only. The future queue remains open.

**Next: Build 297 — Search-First HTML, Product + Story SEO & Crawl Control.**
