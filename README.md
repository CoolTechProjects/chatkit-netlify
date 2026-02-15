# ChatKit Netlify + Auth + Paywall (Stripe)

Aplikacja to statyczny frontend (SPA) + Netlify Functions (backend). Zawiera:
- rejestrację/logowanie użytkownika,
- sesje w cookie `httpOnly`,
- trial 24h po rejestracji,
- paywall dla `/chat`, `/evaluator-nis2`, `/calendly`,
- Stripe Checkout (subskrypcje tygodniowa/miesięczna),
- webhook Stripe aktualizujący status dostępu.

## Stack
- Frontend: vanilla HTML/CSS/JS (SPA, routing po `history.pushState`)
- Backend: Netlify Functions (Node)
- DB: SQLite (`node:sqlite`) + migracja SQL

## Uruchomienie lokalne
1. Uzupełnij `.env` na podstawie `.env.example`.
2. `netlify dev`
3. Otwórz `http://localhost:8888`

## Główne endpointy backendu
- `POST /.netlify/functions/register`
- `POST /.netlify/functions/login`
- `POST /.netlify/functions/logout`
- `GET /.netlify/functions/me`
- `POST /.netlify/functions/billing-checkout`
- `POST /.netlify/functions/billing-webhook`
- `POST /.netlify/functions/chatkit-session`

## Model dostępu
Użytkownik ma dostęp, jeżeli:
- trial nie wygasł (`trial_expires_at > now`) **lub**
- subskrypcja ma status `active`/`trialing`/`past_due` i `current_period_end > now`.

## Manual test checklist
- Rejestracja nowego konta → trial ustawiony na 24h → dostęp do `/chat`, `/evaluator-nis2`, `/calendly`.
- Ręczne ustawienie `trial_expires_at` w przeszłości → wejście na chronione strony przekierowuje do `/pricing?reason=no_access`.
- Zakup planu weekly → checkout success + webhook → `plan=weekly`, `subscription_status=active`, dostęp aktywny.
- Webhook `customer.subscription.deleted` → status zmieniony, dostęp wg `current_period_end`.
- Logowanie i wylogowanie działają poprawnie (cookie sesji tworzone i usuwane).

## Stripe
Szczegóły konfiguracji: `docs/STRIPE_SETUP.md`.
