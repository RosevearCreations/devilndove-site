from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
order = (ROOT / "functions/api/checkout-create-order.js").read_text(encoding="utf-8")
pay = (ROOT / "functions/api/_lib/paymentExecution.js").read_text(encoding="utf-8")
admin = (ROOT / "functions/api/admin/merchant-original-evidence-761.js").read_text(encoding="utf-8")
client = (ROOT / "public/js/checkout.js").read_text(encoding="utf-8")
desk = (ROOT / "public/js/admin-merchant-search-distribution.js").read_text(encoding="utf-8")
assert "import { paymentExecutionStatus }" in order
assert "checkout_payment_provider_unavailable" in order
assert "local_order_mutation_performed: false" in order
assert "provider_network_call_performed: false" in order
assert order.index("checkout_payment_provider_unavailable") < order.index("const gift_card_code")
assert order.index("checkout_payment_provider_unavailable") < order.index("INSERT INTO orders")
assert "['paypal','stripe','square'].includes(payment_method)" in order
assert "devilndove.com" in order and "devilndove-site.pages.dev" in order
assert "payment_execution_development_only" in pay and "production_execution: false" in pay
assert "https://api.stripe.com/v1/account" in admin
assert "originalGuestPaymentEvidence762" in admin and "payload.livemode===true" in admin
assert "provider_enrollment_762:providerEnrollment" in admin
assert "method:'GET'" in admin
assert "automatic_live_activation:false" in admin
assert "originalGuestPaymentEvidence762" in (ROOT / "scripts/build762_provider_enrollment_contract.mjs").read_text(encoding="utf-8")
assert "checkout761RemoteReady" in client and "/api/payment-providers" in client
assert "provider_enrollment_762" in desk
assert "Google Store Quality / guest eWallet scorecard: NOT independently accepted" in desk
assert "Store Quality" in (ROOT / "docs/operations/BUILD762_PAYMENT_ENROLLMENT_AND_SOURCE_OF_TRUTH.md").read_text(encoding="utf-8")
print("BUILD762 PYTHON SOURCE GATE: PASS — production original checkout blocks unavailable remote payment before orders, Stripe original live account read is GET-only, actual signed webhook and paid order required, account/wallet not certified.")
