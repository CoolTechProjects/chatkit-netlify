# Stripe setup

## 1) Produkty i ceny (PLN)
W Stripe Dashboard utwórz 2 ceny subskrypcyjne (recurring):
- Weekly: **19900** (PLN grosze) / tydzień,
- Monthly: **49900** (PLN grosze) / miesiąc.

Zapisz ID cen do zmiennych:
- `STRIPE_WEEKLY_PRICE_ID`
- `STRIPE_MONTHLY_PRICE_ID`

## 2) Webhooki
Aplikacja obsługuje eventy:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`

Endpoint webhooka:
- lokalnie: `http://localhost:8888/.netlify/functions/billing-webhook`
- produkcja: `https://TWOJA-DOMENA/.netlify/functions/billing-webhook`

### Lokalnie (Stripe CLI)
1. `stripe login`
2. `stripe listen --forward-to localhost:8888/.netlify/functions/billing-webhook`
3. Skopiuj podpisany sekret webhooka (`whsec_...`) do `STRIPE_WEBHOOK_SECRET`.

## 3) Zmienne środowiskowe
Skonfiguruj wszystkie wartości z `.env.example`.

## 4) Lokalny test flow
1. Rejestracja użytkownika (`/register`) → trial aktywny.
2. Wejście w `/pricing` i zakup planu.
3. Po opłaceniu Stripe wyśle webhook.
4. Sprawdź `/account` (plan/status/current_period_end).
