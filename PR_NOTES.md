## Co dodano
- Auth użytkowników (register/login/logout) z bezpiecznym hashowaniem hasła i sesją cookie httpOnly.
- Trial 24h od rejestracji (zapisywany w DB).
- Paywall dla `/chat`, `/evaluator-nis2`, `/calendly`.
- Strony: `/register`, `/login`, `/account`, `/pricing`, `/billing/success`, `/billing/cancel`.
- Stripe checkout + webhook synchronizujący status subskrypcji.
- SQLite + migracja `db/migrations/001_init.sql`.
- Dokumentacja Stripe i checklista testów manualnych.

## Jak przetestować lokalnie
1. Uzupełnij `.env`.
2. Uruchom `netlify dev`.
3. Załóż konto przez `/register`.
4. Sprawdź dostęp do chronionych stron.
5. Skonfiguruj Stripe CLI i webhook forwarding.
6. Wykonaj zakup testowy i sprawdź `/account`.

## Znane ograniczenia
- Rate limiting jest prosty (in-memory) i w środowisku serverless nie jest globalnie współdzielony między instancjami.
- SQLite na Netlify może wymagać zewnętrznej bazy w środowisku produkcyjnym o większej skali.
