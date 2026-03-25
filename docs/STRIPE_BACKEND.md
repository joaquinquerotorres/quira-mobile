# Integración Stripe - Requisitos Backend

La app móvil integra Stripe para el pago de suscripciones SOLVER (4,99€/mes) y PRO (12,99€/mes). El frontend redirige a Stripe Checkout; el backend debe implementar los siguientes endpoints y webhooks.

## Endpoint requerido

### POST /stripe/checkout-session

Crea una sesión de Stripe Checkout para suscripción.

**Body (JSON):**
```json
{
  "tier": "SOLVER" | "PRO",
  "professionalProfileId": 123,
  "successUrl": "https://tu-app.com/become-pro?success=1",
  "cancelUrl": "https://tu-app.com/become-pro?canceled=1"
}
```

**Respuesta esperada:**
```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_xxx..."
}
```

**Lógica sugerida (Symfony/API Platform):**
1. Obtener/crear Stripe Customer asociado al User del professionalProfile
2. Crear Checkout Session con `mode: 'subscription'`
3. `line_items`: usar el `price_id` de Stripe para SOLVER o PRO (crear Products y Prices en Stripe Dashboard)
4. `metadata`: `{ professionalProfileId, tier }` para el webhook
5. `success_url`, `cancel_url` del body
6. Devolver `{ url: session.url }`

**Ejemplo con stripe-php:**
```php
$session = \Stripe\Checkout\Session::create([
  'customer' => $stripeCustomerId,
  'mode' => 'subscription',
  'line_items' => [[
    'price' => $tier === 'PRO' ? env('STRIPE_PRICE_PRO') : env('STRIPE_PRICE_SOLVER'),
    'quantity' => 1,
  ]],
  'success_url' => $successUrl,
  'cancel_url' => $cancelUrl,
  'metadata' => [
    'professionalProfileId' => $professionalProfileId,
    'tier' => $tier,
  ],
  // Opcional: trial_period_days si quieres periodo de prueba.
  // Si usas trial, paidThroughAt debe fijarse con subscription.current_period_end
  // (Stripe devuelve la fecha de fin del periodo actual, ya sea trial o pagado).
]);

return ['url' => $session->url];
```

## Webhook Stripe

Configurar webhook para `checkout.session.completed` (y opcionalmente `customer.subscription.updated`, `customer.subscription.deleted`).

En `checkout.session.completed`:
1. Leer `metadata.professionalProfileId` y `metadata.tier`
2. Obtener el ProfessionalProfile y su User
3. Actualizar **siempre** `user.paidThroughAt` con la fecha hasta la que está pagada:
   - Usar `subscription.current_period_end` de Stripe (incluye trial si lo hay)
   - La lógica de tier efectivo (PRO/SOLVER vs FREE) se basa solo en `paidThroughAt`
4. Asegurar que `user.roles` incluye `ROLE_PRO` o `ROLE_SOLVER` según tier

> **Nota:** `paidThroughAt` es la única fuente de verdad. Si hay trial en Stripe, `current_period_end` marca el fin del periodo actual (trial o pagado); el backend debe copiar esa fecha a `paidThroughAt`.

## Variables de entorno backend

- `STRIPE_SECRET_KEY`: Clave secreta de Stripe
- `STRIPE_WEBHOOK_SECRET`: Para verificar firma del webhook
- `STRIPE_PRICE_SOLVER`: price_xxx del producto SOLVER (4,99€/mes)
- `STRIPE_PRICE_PRO`: price_xxx del producto PRO (12,99€/mes)
