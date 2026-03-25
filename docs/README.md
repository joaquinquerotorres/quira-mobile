# Documentación de Quira Mobile

## Contenido

- **[ARQUITECTURA.md](./ARQUITECTURA.md)** — Documentación funcional de la aplicación:
  - Tipos de usuario y tiers (CLIENTE, FREE, SOLVER, PRO)
  - Ciclo de vida de las solicitudes
  - Propuestas (pujas): estados, quién puede pujar, orden
  - Preguntas (Request Questions)
  - Mercado y oportunidades
  - Suscripción y Stripe
  - Rutas, endpoints y estructuras de datos

- **[STRIPE_BACKEND.md](./STRIPE_BACKEND.md)** — Requisitos de backend para la integración con Stripe (checkout, webhooks, `paidThroughAt`).

## Variables de entorno

Copia `.env.example` a `.env` y configura:

| Variable | Descripción |
|----------|-------------|
| `VITE_API_URL` | URL base de la API (ej. `https://api.quira.app/api`) |
| `VITE_GOOGLE_MAPS_KEY` | Clave de Google Maps para autocompletado (opcional) |

## Firebase (Android/iOS) — ficheros locales (NO subir al repo)

Los ficheros nativos de Firebase **no deben commitearse** (están en `.gitignore`):

- Android: `android/app/google-services.json`
- iOS: `ios/App/App/GoogleService-Info.plist`

En el repo dejamos **plantillas** sin datos sensibles:

- Android: `android/app/google-services.json.example`
- iOS: `ios/App/App/GoogleService-Info.plist.example`

### Configuración en local

1. Copia las plantillas a los nombres reales:
   - `cp android/app/google-services.json.example android/app/google-services.json`
   - `cp ios/App/App/GoogleService-Info.plist.example ios/App/App/GoogleService-Info.plist`
2. Sustituye los valores `REPLACE_ME_*` por los de tu proyecto Firebase (desde Firebase Console).

### Configuración en CI (GitHub Actions)

Recomendado: guardar los ficheros reales como **Secrets** en base64 y recrearlos en el runner.

1. En GitHub: `Settings → Secrets and variables → Actions → Secrets`
   - `ANDROID_GOOGLE_SERVICES_JSON_BASE64`
   - `IOS_GOOGLE_SERVICE_INFO_PLIST_BASE64`
2. En CI, antes de compilar Android/iOS, decodifica:

```bash
echo "$ANDROID_GOOGLE_SERVICES_JSON_BASE64" | base64 --decode > android/app/google-services.json
echo "$IOS_GOOGLE_SERVICE_INFO_PLIST_BASE64" | base64 --decode > ios/App/App/GoogleService-Info.plist
```

Nota: en el CI actual (web build + tests) **no hace falta** recrearlos salvo que añadas jobs de build nativo.

## Builds nativos (Android/iOS) en CI bajo demanda

Hay un workflow manual para generar builds nativos sin ejecutarlos en cada PR:

- GitHub Actions: **Native build (manual)**
- Entrada: `platform = android | ios | both`

Este workflow:
- genera `.env` en el runner desde `vars.*`
- restaura opcionalmente los configs nativos de Firebase desde Secrets base64
- construye:
  - Android: `assembleDebug` y sube el APK como artifact
  - iOS: build de **simulador** sin signing (útil para validar que compila)

## CI/CD (GitHub Actions) — checklist y configuración “release-ready”

### Branch protection (GitHub UI)

Recomendado para `main`:

- Requerir Pull Request para merge
- Requerir approvals (mínimo 1)
- Requerir status checks antes de merge:
  - `CI / lint`
  - `CI / unit`
  - `CI / build`
  - `CI / e2e`
- Bloquear force-push (salvo admins) y restringir quién puede push

### Dependabot

El repo incluye `.github/dependabot.yml` para abrir PRs semanales de:
- dependencias `npm`
- workflows de GitHub Actions

### Quality gate manual

Workflow manual: **Quality gate (manual)**.

- Ejecuta lint + unit + build y, opcionalmente, Cypress completo (no solo smoke).
- Úsalo justo antes de subir a stores o generar un release.

### Release nativo firmado (Android/iOS)

Workflow manual: **Native release (manual, signed)**.

#### Android (AAB firmado)

Secrets necesarios (GitHub → Settings → Secrets and variables → Actions → Secrets):
- `ANDROID_KEYSTORE_BASE64` (keystore en base64)
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

Opcional si usas Firebase en Android:
- `ANDROID_GOOGLE_SERVICES_JSON_BASE64`

El workflow genera un `.aab` en `android/app/build/outputs/bundle/release/` y lo sube como artifact.

#### iOS (IPA firmado)

El job de iOS está dejado como **plantilla** (para evitar builds falsamente “verdes” sin signing).
Para habilitarlo necesitas aportar certificados y provisioning profiles (recomendado: Fastlane match).

## Tests (recomendado antes de release)

### Unit / Integration (Vitest)

- Ejecutar toda la suite:
  - `npm test`
- Modo watch (desarrollo):
  - `npm run test.unit`

### End-to-end (Cypress)

- Ejecutar en CI (headless):
  - `npm run test.e2e`
- Abrir UI de Cypress:
  - `npm run cy:open`

### Notas de estabilidad en tests

- Algunos tests **stubbean componentes de Ionic** (p. ej. `IonAlert`, wrappers sin `IonApp`) para evitar timers internos que pueden producir errores al teardown en `jsdom`.
- El objetivo es priorizar tests **deterministas** y rápidos para reducir flakiness antes de publicar.
