# Admin Quira (app móvil)

Panel interno dentro de la misma app Ionic. Con `ROLE_ADMIN`:

- Tras login → `/admin` (no shell cliente/pro).
- **Tab bar admin**: Resumen · Solicitudes · Ofertas · Más · Perfil.
- Rutas cliente/pro (`/request-list`, `/new-request`, mercado, etc.) redirigen a `/admin`.
- **Perfil** reducido: solo cambiar contraseña + cerrar sesión.

Roadmap de módulos (1 PR de contenido cada uno; el shell ya reserva rutas):

1. **Dashboard / Resumen** — KPIs, embudo, colas, tendencias  
2. Solicitudes (`/admin/requests`)  
3. Ofertas (`/admin/bids`)  
4. Usuarios / pros (`/admin/users`, vía Más)  
5. Suscripciones / Stripe  
6. Calidad y confianza  
7. Ops / producto  
8. Plataforma e instalación  
9. Herramientas (buscador, export, flags, audit)

---

## Fase 1 — Dashboard (contrato API)

### Auth

- Rol Symfony: `ROLE_ADMIN`.
- Todas las rutas `/api/admin/*` requieren `is_granted('ROLE_ADMIN')`.
- Respuestas: `403` si no admin; `401` si sin JWT.

### Usuario admin (NO fixtures / NO migrations)

El operador **no** debe crearse con Doctrine fixtures ni con migraciones SQL (ni contraseñas en el repo).

Provisionamiento recomendado en Railway:

1. Variables de entorno (solo en el servicio API, secretas):
   - `ADMIN_EMAIL` — p. ej. tu email
   - `ADMIN_PASSWORD` — contraseña fuerte generada fuera del repo
2. Comando Symfony idempotente, p. ej. `app:admin:ensure`:
   - Si no existe user con ese email → lo crea con password hasheado + `ROLE_ADMIN` (y `ROLE_CLIENT` si hace falta para usar la app).
   - Si existe → asegura `ROLE_ADMIN` y **opcionalmente** actualiza el password solo si pasas un flag (`--reset-password`) o si `ADMIN_PASSWORD` cambió y el comando lo contempla de forma explícita.
3. Ejecutar **una vez** (o tras rotar credenciales) con `railway run` / one-off en el servicio web — **no** en cada request HTTP.
4. Tras crear el user, puedes quitar `ADMIN_PASSWORD` del entorno si quieres (dejar solo el hash en BD); o rotarla y volver a correr el comando.

Prohibido: emails/passwords en fixtures, migrations, `.env` del repo, seeds commiteados.

### `GET /api/admin/stats/overview`

Query:

| Param | Tipo | Notas |
|-------|------|--------|
| `from` | `YYYY-MM-DD` | Inicio periodo (inclusivo, zona Europe/Madrid recomendada) |
| `to` | `YYYY-MM-DD` | Fin periodo (inclusivo) |

El cliente envía rangos `7d` / `30d` / `90d` convertidos a `from`/`to` (día civil local del dispositivo).

Respuesta JSON (`Content-Type: application/json`, no hace falta Hydra):

```json
{
  "period": {
    "from": "2026-07-01",
    "to": "2026-07-31",
    "previousFrom": "2026-06-01",
    "previousTo": "2026-06-30"
  },
  "kpis": {
    "newUsers": { "value": 10, "previous": 8 },
    "newPros": { "value": 3, "previous": 2 },
    "newRequests": { "value": 20, "previous": 15 },
    "newBids": { "value": 40, "previous": 30 },
    "acceptedBids": { "value": 5, "previous": 4 },
    "completedRequests": { "value": 2, "previous": 1 },
    "activePaidSubscriptions": { "value": 7, "previous": 6 },
    "cancelAtPeriodEnd": { "value": 1 }
  },
  "funnel": {
    "registered": 10,
    "phoneVerified": 8,
    "firstRequest": 5,
    "firstBid": 4,
    "acceptedJob": 2,
    "completedJob": 1,
    "reviewed": 1
  },
  "queues": {
    "pendingApproval": 2,
    "pendingVisitRequests": 1
  },
  "timeseries": {
    "grain": "day",
    "points": [
      {
        "date": "2026-07-01",
        "newUsers": 1,
        "newRequests": 2,
        "newBids": 3,
        "acceptedBids": 0
      }
    ]
  }
}
```

### Definiciones de métricas

| Campo | Definición |
|-------|------------|
| `period.previous*` | Periodo anterior **de la misma duración** inmediatamente antes de `from`. |
| `newUsers` | Users con `createdAt` en el periodo. |
| `newPros` | `ProfessionalProfile` creados en el periodo. |
| `newRequests` | Requests creadas en el periodo. |
| `newBids` | Bids creadas en el periodo. |
| `acceptedBids` | Bids que pasaron a `ACCEPTED` en el periodo (por `updatedAt` o evento de aceptación). |
| `completedRequests` | Requests que pasaron a `COMPLETED` en el periodo. |
| `activePaidSubscriptions` | Pros/users con `paidThroughAt` **estrictamente futuro** en el instante de la consulta (snapshot; `previous` = snapshot al final del periodo anterior si es viable, o mismo criterio documentado). |
| `cancelAtPeriodEnd` | Count actual con `subscriptionCancelAtPeriodEnd = true` (snapshot). |
| `funnel.registered` | Users creados en el periodo. |
| `funnel.phoneVerified` | De esos (o en el periodo): users con teléfono de cliente o pro verificado — elegir y documentar: preferible **users del periodo que tienen verifiedPhone en client o pro**. |
| `funnel.firstRequest` | Users del periodo (o ever) que publicaron ≥1 request — preferible: **primera request del user cae en el periodo**. |
| `funnel.firstBid` | Igual para primera bid del pro. |
| `funnel.acceptedJob` | Primera aceptación (request ACCEPTED / bid ACCEPTED) en el periodo. |
| `funnel.completedJob` | Primera completed en el periodo. |
| `funnel.reviewed` | Users/jobs con ≥1 review creada en el periodo (como author o sobre el trabajo — documentar: **reviews creadas en el periodo**). |
| `queues.pendingApproval` | Count actual `Request.status = PENDING_APPROVAL`. |
| `queues.pendingVisitRequests` | Count actual `VisitRequest.status = PENDING`. |
| `timeseries.points` | Un punto por día civil entre `from` y `to` (días sin actividad → ceros). |

### Frontend

- Ruta: `/admin` (`src/pages/admin/AdminDashboard.tsx`).
- Guard cliente: `ROLE_ADMIN` en `localStorage.user.roles` (`src/utils/adminAccess.ts`).
- Cliente HTTP: `src/api/adminApi.ts` → `GET /admin/stats/overview`.

---

## Prompt Quira (backend) — pegar en el agente del API

```text
Implementa la Fase 1 del Admin Quira en el backend (API Platform / Symfony en Railway).

## Objetivo
Exponer métricas de dashboard solo para ROLE_ADMIN, consumidas por la app móvil (contrato en docs/ADMIN.md del repo quira-mobile).

## Auth
1. Añade el rol `ROLE_ADMIN` (constante / hierarchy si aplica).
2. **NO** uses fixtures ni migrations para crear el admin ni para meter passwords.
3. Implementa un comando Symfony idempotente `app:admin:ensure` que lea `ADMIN_EMAIL` y `ADMIN_PASSWORD` del entorno:
   - Si faltan esas env → error claro y exit ≠ 0.
   - Si el user no existe → créalo con password hasheado (mismo hasher que el login email/password de la app) + roles `ROLE_ADMIN` y `ROLE_CLIENT` (para poder entrar a la app).
   - Si el user existe → asegúrate de que tenga `ROLE_ADMIN`; con opción `--reset-password` actualiza el hash desde `ADMIN_PASSWORD`.
   - Marca email/teléfono verificados si tu login lo exige para operar, o documenta qué hace falta.
4. Todas las rutas bajo `/api/admin` deben exigir `is_granted('ROLE_ADMIN')`. Sin ese rol → 403.
5. Documenta en README del API: `railway variables` + `railway run php bin/console app:admin:ensure` (one-off).

## Endpoint
`GET /api/admin/stats/overview?from=YYYY-MM-DD&to=YYYY-MM-DD`

- Content-Type: application/json (objeto plano, no Hydra).
- Validar `from`/`to` (to >= from; límite máx. p.ej. 366 días).
- Zona horaria recomendada para “día civil”: Europe/Madrid.
- Calcular `previousFrom`/`previousTo` como el intervalo inmediatamente anterior con la misma duración en días.

## Payload
Devolver exactamente la forma documentada en quira-mobile `docs/ADMIN.md` (period, kpis con value/previous, funnel, queues, timeseries.grain=day + points diarios con newUsers, newRequests, newBids, acceptedBids).

## Métricas (usar definiciones de docs/ADMIN.md)
- newUsers / newPros / newRequests / newBids por createdAt en periodo.
- acceptedBids / completedRequests por transición a ACCEPTED/COMPLETED en el periodo (updatedAt o tabla de eventos si existe).
- activePaidSubscriptions: count con paidThroughAt > now().
- cancelAtPeriodEnd: count subscriptionCancelAtPeriodEnd = true.
- Colas: Request PENDING_APPROVAL; VisitRequest PENDING (snapshots actuales).
- Funnel: registered, phoneVerified, firstRequest, firstBid, acceptedJob, completedJob, reviewed — documentar en comentario de código la definición exacta elegida si hay ambigüedad; preferir las “preferible” del doc.
- timeseries: un punto por cada día del rango, ceros si no hay datos.

## Calidad
- Tests unitarios/funcionales del endpoint (admin 200, no-admin 403, anon 401).
- Índices/consultas razonables (evitar N+1); OK aggregations SQL.
- No exponer PII en este endpoint (solo contadores).

## Fuera de alcance de esta fase
Listados de solicitudes/ofertas/users, acciones de moderación, plataforma iOS/Android, exports. Eso serán fases 2–9.
```
