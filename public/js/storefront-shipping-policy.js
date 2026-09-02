// Release 467 Build 15 — visible fulfillment-policy parity for Shop, Cart, Checkout and Product surfaces.
document.addEventListener('DOMContentLoaded', () => {
  const parity = window.DDStorefrontParity;
  if (!parity) return;
  const policy = parity.SHIPPING_POLICY;
  const notice = document.createElement('div');
  notice.className = 'status-note';
  notice.setAttribute('data-storefront-shipping-policy', policy.code);
  notice.innerHTML = `<strong>Current shipping policy:</strong> ${policy.public_message}`;

  if (window.location.pathname.startsWith('/checkout/')) {
    const shippingCountry = document.getElementById('shipping_country');
    if (shippingCountry) {
      shippingCountry.value = policy.country_name;
      shippingCountry.readOnly = true;
      shippingCountry.setAttribute('aria-describedby', 'storefrontShippingPolicyNotice');
    }
    const form = document.getElementById('checkoutForm');
    if (form) {
      notice.id = 'storefrontShippingPolicyNotice';
      form.prepend(notice);
      form.addEventListener('submit', (event) => {
        if (!parity.isAllowedShippingCountry(shippingCountry?.value || policy.country_name)) {
          event.preventDefault();
          event.stopImmediatePropagation();
          const message = document.getElementById('checkoutMessage');
          if (message) { message.textContent = policy.public_message; message.style.display = ''; message.style.color = '#b00020'; }
        }
      }, true);
    }
    return;
  }

  const cartHost = document.getElementById('cartPolicyTrustMount');
  if (cartHost) { cartHost.prepend(notice); return; }
  const shopHost = document.getElementById('shopPolicyFaqMount');
  if (shopHost) { shopHost.parentNode?.insertBefore(notice, shopHost); return; }
  const policyCard = document.getElementById('productPolicyCard');
  if (policyCard) policyCard.prepend(notice);
});
