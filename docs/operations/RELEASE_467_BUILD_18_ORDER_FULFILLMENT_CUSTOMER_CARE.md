# Release 467 Build 18 — Order Fulfillment & Customer Care Command Center

## Purpose

Build 18 begins after the original 20-item autonomous sequence closed fully green at **Release 467 Build 17** Development SHA `7f3363954434801e9226b29d83899ea795713525`, tree `0df69c0b24484536e6f50e21a523c915d101923a`. Build 17 System Gate `33665275366` and Build 17 Proof `33665275406` are the exact predecessor evidence.

Build 18 creates one read-only post-sale operating view across standard orders and custom work. It is not a second order system and it does not assume provider acceptance that remains `HOLD_EXTERNAL`.

## Command-center scope

`/admin/order-fulfillment-care/` reads `/api/admin/order-fulfillment-care` and ranks existing facts into these attention lanes:

- **Policy** — especially any shipping-country mismatch against the Canada-only fulfillment authority.
- **Payment** — unpaid or incomplete local orders that still require owner review.
- **Fulfillment** — paid orders that remain pending long enough to warrant packing/pickup/shipping review.
- **Refund** — requested, submitted, pending or failed refund records that require explicit review.
- **Custom order** — accepted/quoted custom requests whose reviewed order draft is not yet connected to a real order.
- **Customer care** — stale or missing reviewed custom-order stage evidence.
- **After sale** — completed custom work whose consent/review follow-up remains open.

The projection also groups recent customer activity so operators can see standard-order and custom-request context together without creating a new customer authority.

## Existing authorities retained

Standard-order facts are read from existing `orders`, `payments`, `payment_refunds`, and `order_status_history` data. Custom-work facts are read from `custom_requests`, `custom_request_order_drafts`, `custom_request_order_stage_events`, `custom_request_fulfillment_prompts`, and `custom_request_order_status_links`.

All writes stay in their existing owner workspaces:

- `/admin/orders/`
- `/admin/custom-request/`
- `/admin/customers/`
- `/admin/accounting/`

The existing legacy Custom Requests route still owns broad operational mutations and some historical schema self-repair. Build 18 does **not** call those mutation/bootstrap paths. Its new endpoint contains no request-time DDL or DML and exposes no POST handler.

## Safety boundary

Build 18 performs or authorizes none of the following:

- automatic order-status mutation;
- automatic payment mutation/capture;
- automatic refund execution;
- automatic customer messaging;
- automatic custom-order stage advancement;
- automatic fulfillment/shipping action;
- payment-provider or shipping-provider execution;
- schema migration or request-time DDL;
- new broad D1 or R2 mutation authority;
- raw R2 deletion;
- Cloudflare Access policy mutation;
- `main` or Production mutation.

Canada-only shipping remains the authority. The existing **U.S. sales/shipping suspension** remains intact.

External lanes remain `HOLD_EXTERNAL`: Cloudflare Access service-token acceptance, Stripe Development, PayPal sandbox, and Social/OAuth. CAIP private media continues to use fresh Build 7 evidence.

## Production checkpoint

Production remains separately verified at Release 467 Build 15 SHA `296e53b079bba53126c80902be36a9271d82cea4`; Production Pages Deploy `33655223149` succeeded there. Build 18 has no Production authorization.

## Closure rule

Build 18 is not complete because its code exists. Require exact feature-head Build 18 proof, the complete current/historical PR fanout, unchanged-head merge to `dev`, then exact merged-SHA Build 18 proof plus canonical System Gate/Development deployment. The final merged-push sweep must have no failed, queued or in-progress runs before Build 18 is called Development GREEN.
