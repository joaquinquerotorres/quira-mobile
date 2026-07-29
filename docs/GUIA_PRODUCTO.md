# Quira — Guía de producto

Documento orientado a **marketing y product management**. Explica qué hace la plataforma, cómo la viven clientes y profesionales, y qué reglas de negocio importan para comunicar el producto. No es documentación técnica.

**Última revisión:** julio 2026  
**Producto:** app móvil (Android / iOS) + web de marketing en [quira.app](https://quira.app)  
**Slogan:** *Tú descansa, Quira se encarga.*

---

## 1. ¿Qué es Quira?

Quira es un **marketplace de servicios del hogar** que conecta a personas que necesitan un arreglo o un trabajo en casa con profesionales de su zona.

La diferencia clave frente a un tablón de anuncios clásico:

1. El cliente **no rellena un formulario técnico**. Describe el problema como quiera (texto, audio, vídeo o fotos).
2. Una **inteligencia artificial** convierte esa descripción en un anuncio claro: título, categoría, dificultad y orientación de precio.
3. Los profesionales **ven trabajos de su zona** y envían propuestas.
4. El cliente **elige** la propuesta que más le conviene.
5. La **dirección exacta** solo se comparte cuando el cliente acepta a un profesional.

Quira no cobra comisión sobre el importe del trabajo: el profesional cobra al cliente de forma directa. El modelo de negocio de Quira para profesionales son **planes de suscripción** (Free, Solver y Pro).

---

## 2. A quién va dirigido

### Clientes (hogares)

Personas que necesitan fontanería, electricidad, pintura, manitas, limpieza, jardinería, climatización, reformas, etc., y quieren:

- Explicar el problema sin tecnicismos.
- Recibir varias propuestas.
- Comparar precio, valoración y plan del profesional.
- No dar su dirección exacta hasta decidir.

### Profesionales

Desde autónomos con CIF hasta personas que “saben hacer cosas” (pintar, montar muebles, chapuzas) y quieren:

- Recibir avisos de trabajos cerca.
- Decidir su precio (aceptar, contraofertar o pedir visita cuando aplique).
- Empezar gratis y subir de plan si les compensa.
- Construir reputación con reseñas.

**Importante:** la misma cuenta puede ser **cliente y profesional a la vez**. Pedir un arreglo en casa y, por otro lado, ofertar trabajos en el mercado.

---

## 3. Alcance actual (lanzamiento)

En el lanzamiento, Quira opera principalmente en **Córdoba (Andalucía, España)**.

- Al publicar o guardar una dirección, la app solo acepta ubicaciones en esa provincia.
- El directorio, el mercado y las notificaciones están pensados para esa zona de cobertura.
- La idea de producto es **escalar a más zonas** cuando el modelo esté validado.

Para marketing: conviene decir “empezamos en Córdoba” con claridad, no “toda España” todavía.

---

## 4. Las dos experiencias

### 4.1 Experiencia del cliente

#### Paso 1 — Contar el problema

Desde el botón **Pedir**, el cliente elige cómo explicar el problema:

| Modo | Qué hace el usuario |
|------|---------------------|
| Texto + imagen | Escribe y, si quiere, adjunta fotos |
| Audio | Graba o sube un audio |
| Vídeo | Graba o sube un vídeo corto |

La app acepta ficheros hasta unos topes claros (imagen ~10 MB, audio ~12 MB, vídeo ~40 MB), iguales con Wi‑Fi o datos móviles. En vídeo, si la red es de datos o lenta, puede optimizar el archivo antes de subirlo.

Antes de publicar hace falta tener **teléfono de cliente verificado** en el perfil. Si no lo tiene, la app le avisa y le lleva a Perfil (puede guardar un borrador para no perder lo que ya había escrito o grabado).

#### Paso 2 — La IA prepara el anuncio

Quira genera (y el cliente puede revisar):

- **Título** claro del trabajo.
- **Descripción** más técnica / útil para el profesional.
- **Categoría** (fontanería, electricidad, etc.).
- **Dificultad** (baja, media o alta) — la marca la IA; el cliente no la elige a mano.
- **Orientación de precio**: fijo estimado, rango estimado, o “requiere visita de valoración”.
- **Preferencia de disponibilidad** (urgente, esta semana, a convenir…).

El cliente indica **zona aproximada**. La dirección exacta **no** se publica aún.

Opcionalmente puede añadir más fotos, vídeos o audios para que las propuestas sean mejores.

#### Paso 3 — Recibir propuestas

Los profesionales cercanos ven la solicitud en el **Mercado** y pueden:

- Enviar una **propuesta económica** (precio fijo o rango, según el tipo de trabajo).
- **Preguntar** dudas antes de comprometerse.
- En ciertos casos, **pedir una visita** para valorar in situ.

El cliente ve las ofertas ordenadas con lógica de producto:

1. Primero planes superiores (Pro → Solver → Free).
2. Dentro del mismo plan, precio más bajo primero.
3. Si empatan, mejor valoración.

#### Paso 4 — Aceptar y compartir dirección

Al aceptar una propuesta:

- Ese profesional queda asignado.
- El cliente facilita la **dirección exacta**.
- Ambos pueden contactarse (llamar).
- Cuando el profesional marca el trabajo como **finalizado**, pueden valorarse mutuamente.

El cliente puede **cancelar** una solicitud solo mientras sigue pendiente y sin profesional asignado.

---

### 4.2 Experiencia del profesional

#### Activar perfil

Desde **¡Quiero trabajar!** / registro profesional, el usuario:

1. Elige plan (Free, Solver o Pro).
2. Completa nombre, teléfono, bio, especialidades (skills) y **zona de cobertura** (dirección base + radio de actuación).
3. Si elige Solver o Pro, paga la suscripción (pago gestionado con Stripe; los planes de pago pueden incluir periodo promocional, p. ej. primeros meses gratis según la oferta activa).
4. Para **Pro** hace falta **CIF** válido (perfil más “serio” / verificado).

Para enviar propuestas hace falta **teléfono profesional verificado**.

#### Mercado de oportunidades

Pestaña **Mercado**: listado de trabajos abiertos de la zona, con filtros y búsqueda.

En cada oportunidad ve:

- Título, categoría, zona aproximada.
- Rango o precio estimado (o aviso de visita).
- Si hay foto, audio o vídeo: botón **Media** que abre un visor (no se reproduce en la propia tarjeta).
- Si ya envió propuesta (“ENVIADA”).
- Si es de **alta dificultad**, puede verse borroso o bloqueado según su plan.

#### Enviar propuesta (“Me interesa”)

El profesional indica:

- Precio fijo **o** rango (según lo que permita ese trabajo).
- Cuándo podría hacerlo.
- Comentario / detalle de la propuesta.

Reglas importantes:

- Plan **Free** (o suscripción caducada): máximo **3 propuestas al mes**.
- Solver y Pro con suscripción activa: **propuestas ilimitadas** (con matices de dificultad; ver sección 6).
- Si el trabajo **requiere visita**, no se hace una puja rápida desde el listado: hay que ir al detalle y seguir el flujo de visita.

#### Gestión (“Mis trabajos”)

Pestaña **Gestión**:

- Sus **propuestas** (pendientes, ganadas, cerradas).
- Sus **trabajos asignados** (en curso / finalizados).

Puede retirar una propuesta mientras el trabajo siga abierto.

#### Visitas de valoración

Cuando el sistema lo habilita (sobre todo trabajos difíciles o que la IA marca como “requiere visita”):

1. El profesional (típicamente **Pro**) solicita visita.
2. El cliente acepta o rechaza.
3. Si acepta, se desbloquea contacto (teléfono / dirección según el caso) para valorar en persona y luego presupuestar con más seguridad.

#### Finalizar y reseñar

El profesional marca el trabajo como completado. Cliente y profesional pueden dejar **reseña** (estrellas + comentario). Las reseñas alimentan el perfil público.

---

## 5. ¿Quién pone el precio?

Esta es una de las preguntas más frecuentes. Resumen claro para comunicar:

| Momento | Quién decide | Qué es |
|---------|--------------|--------|
| Al publicar | La **IA** (con tablas de referencia de mercado) | Orientación: fijo, rango o “hay que verlo” |
| Al ofertar | El **profesional** | Su propuesta real (fijo o rango) |
| Al contratar | El **cliente**, al aceptar una propuesta | Ese es el **precio acordado del servicio** |

- Quira **no fija** el precio final del trabajo.
- La IA **orienta** para que el anuncio sea realista.
- El profesional **oferta**.
- El cliente **elige** y cierra.

Con el tiempo, los precios realmente aceptados ayudan a **afinar** las estimaciones de la IA (aprendizaje de mercado), pero eso es interno: hacia fuera el mensaje es “orientación inteligente + acuerdo entre personas”.

---

## 6. Dificultad: quién ve qué

La dificultad la marca la IA. No es solo una etiqueta: **cambia quién puede ver y responder**.

| Dificultad | Free | Solver | Pro |
|------------|------|--------|-----|
| **Baja** | Ve y puede proponer (con límite mensual) | Ve y propone sin límite | Ve y propone |
| **Media** | Igual | Igual | Igual |
| **Alta** | No ve el detalle (borroso) / no propone | Puede ver, **no** puede proponer | Ve y puede proponer; puede pedir visita cuando aplique |

Mensaje de marketing útil:

> Los trabajos más delicados quedan reservados a profesionales Pro, para más seguridad del cliente.

---

## 7. Planes para profesionales (monetización)

Precios según la app / landing actual:

| Plan | Precio | Idea de producto |
|------|--------|------------------|
| **Free** | 0 €/mes | Probar sin compromiso |
| **Solver** | 4,99 €/mes | Más trabajo y avisos en tiempo real |
| **Pro** | 11,99 €/mes | Acceso total + prioridad + trabajos de alta dificultad (requiere CIF) |

### Free

- Avisos principalmente por **correo**.
- Trabajos de dificultad baja y media.
- **3 propuestas al mes**.
- Perfil público con bio y reseñas.
- Puede reseñar a clientes.
- No acceso real a alta dificultad ni push en tiempo real.

### Solver (“más popular” en landing)

- **Notificaciones push** en tiempo real.
- Propuestas **ilimitadas**.
- Baja y media dificultad.
- Puede **ver** alta dificultad, pero **no contraofertar**.
- Prioridad en listados por encima de Free.
- Periodo promocional habitual: primeros meses gratis (configurado en la oferta de pago).

### Pro

- Todo lo de Solver útil para un profesional serio.
- Acceso a **alta dificultad**.
- Máxima **prioridad** en listados de ofertas (frente a Solver y Free).
- Perfil con **CIF verificado**.
- También con periodo promocional habitual en planes de pago.

### Qué pasa si deja de pagar

Si un Solver/Pro no renueva:

- Pasa a comportarse como **Free** (límites de propuestas, sin alta dificultad, etc.).
- Sigue viendo trabajos ya en curso.
- La app puede mostrar un aviso de “cuota no renovada” y opciones para reactivar.

Si cancela la suscripción, normalmente **sigue con el plan hasta el final del periodo ya pagado**.

---

## 8. Confianza, privacidad y verificación

### Dirección privada

- Al publicar: solo **zona aproximada**.
- Dirección exacta: al **aceptar** la propuesta (o en flujos de visita aceptada).
- Mensaje estrella de marca: *Tu dirección, siempre privada hasta que tú decides.*

### Verificaciones

| Qué | Para qué |
|-----|----------|
| Email | Alta de cuenta / seguridad |
| Teléfono cliente | Poder **publicar** solicitudes |
| Teléfono profesional | Poder **enviar propuestas** |
| CIF | Obligatorio en plan **Pro** |

### Moderación

La IA también ayuda a detectar contenido inseguro o intentos de saltarse la plataforma (p. ej. dejar contacto fuera de Quira). Si algo no encaja, la solicitud puede quedar en **revisión** antes de publicarse.

### Reviews bidireccionales

- El cliente valora al profesional.
- El profesional puede valorar al cliente.
- Rating y número de reseñas se ven en ofertas, perfiles y directorio.

---

## 9. Directorio de profesionales

Además del flujo “publico un trabajo y me llegan ofertas”, el cliente puede:

- Explorar el **Directorio** por categoría o búsqueda.
- Ver ficha: foto, bio, especialidades, plan (Free / Solver / Pro), valoración y reseñas.
- Usarlo como escaparate de confianza y descubrimiento.

En Inicio también hay un bloque de **profesionales destacados** y acceso rápido a categorías populares.

---

## 10. Notificaciones (qué siente el usuario)

Según el plan y el rol (cliente vs profesional), los avisos pueden llegar por **push**, **email** o, en algunos entornos, otros canales configurados.

Ejemplos de momentos que generan aviso:

- Nueva solicitud cerca (profesionales).
- Nueva propuesta en mi solicitud (cliente).
- Propuesta aceptada (profesional).
- Pregunta / respuesta en el hilo.
- Solicitud de visita / visita aceptada o rechazada.
- Nueva reseña.

El usuario puede ajustar preferencias en **Perfil → notificaciones** (actividad de solicitudes, propuestas, reseñas).

---

## 11. Pantallas principales de la app (mapa mental)

| Zona | Para quién | Para qué |
|------|------------|----------|
| **Inicio** | Sobre todo cliente | Mis solicitudes + descubrir categorías y pros |
| **Pedir** | Cliente | Crear nueva solicitud con IA |
| **Mercado** | Profesional | Ver oportunidades y proponer |
| **Gestión** | Profesional | Mis propuestas y trabajos |
| **Perfil** | Todos | Datos, verificación, suscripción, privacidad, cerrar sesión |
| **Directorio** | Todos | Explorar profesionales |
| Login / registro / recuperar contraseña / verificar email | Público | Entrar en la plataforma |

Login:

- Email y contraseña en todos los entornos.
- **Google / Apple** en la app nativa (no como promesa principal en web).

---

## 12. Categorías de servicio (orientativas)

Las que la producto comunica hoy:

- Fontanería  
- Electricidad  
- Reformas / albañilería  
- Pintura  
- Jardinería  
- Limpieza  
- Climatización  
- Manitas / DIY  

La IA clasifica automáticamente; el usuario puede corregir al revisar el anuncio.

---

## 13. Estados de un trabajo (lenguaje de producto)

| Estado que ve el usuario | Significado |
|--------------------------|-------------|
| Pendiente | Publicado; esperando / recibiendo propuestas |
| En revisión | Validación interna (p. ej. seguridad) |
| Asignado | Hay profesional contratado; trabajo en curso |
| Finalizado | Trabajo completado; toca valorar |

Una **propuesta** puede estar pendiente o aceptada. Si el profesional la retira, deja de verse al cliente.

---

## 14. Propuesta de valor (mensajes listos para copy)

### Para clientes

- Describe el problema como quieras: texto, audio o vídeo.
- La IA te prepara el anuncio.
- Compara propuestas de profesionales de tu zona.
- Tu dirección exacta solo cuando tú aceptas.
- Valora el trabajo al terminar.

### Para profesionales

- Trabajos cerca, sin buscar clientes a ciegas.
- Empieza gratis; sube de plan cuando quieras.
- Tú pones el precio.
- Sin comisión de Quira sobre el importe del servicio (modelo por suscripción).
- También si no tienes empresa: el plan Free no exige CIF.

### Diferenciadores frente a “pedir presupuesto por WhatsApp”

- Anuncio estructurado (categoría, dificultad, media).
- Varias ofertas comparables.
- Privacidad de dirección.
- Reputación visible (reseñas).
- Filtro de dificultad para trabajos delicados.

---

## 15. Lo que Quira **no** es (para no sobreprometer)

- **No** es un chat genérico tipo redes sociales: el hilo útil es pregunta–respuesta + propuesta + visita.
- **No** gestiona el cobro del servicio al cliente (el pago del trabajo es entre cliente y profesional).
- **No** garantiza un número fijo de leads al mes (sí garantiza reglas de acceso según plan).
- **No** cubre aún toda España: foco de lanzamiento en Córdoba.
- **No** deja que cualquiera acepte trabajos de alta dificultad: eso es territorio Pro.

---

## 16. Glosario rápido (para el equipo)

| Término interno | Cómo hablarlo hacia fuera |
|-----------------|---------------------------|
| Request / solicitud | Anuncio o pedido de trabajo |
| Bid / puja | Propuesta u oferta del profesional |
| Tier / plan efectivo | Plan Free, Solver o Pro (el que realmente tiene activo) |
| Risk level | Dificultad baja / media / alta |
| Visit request | Solicitud de visita de valoración |
| paidThroughAt | “Suscripción activa hasta…” (concepto interno; en UI: plan activo) |
| Mercado | Listado de trabajos abiertos para profesionales |
| Directorio | Escaparate de profesionales |

---

## 17. Checklist útil para campañas o landing

Al escribir una pieza de marketing, conviene comprobar:

- [ ] ¿Dejas claro si hablas al **cliente** o al **profesional**?
- [ ] ¿Mencionas Córdoba / zona de lanzamiento si hace falta?
- [ ] ¿El precio del trabajo lo presenta como **acuerdo** (IA orienta, pro oferta, cliente elige)?
- [ ] ¿La dirección exacta aparece como **privada hasta aceptar**?
- [ ] ¿Los planes Free / Solver / Pro coinciden con la tabla de la sección 7?
- [ ] ¿Alta dificultad = solo Pro (Solver puede ver, no ofertar)?
- [ ] ¿Free = 3 propuestas/mes y avisos por email?
- [ ] ¿Pro = CIF + acceso total?
- [ ] ¿Evitas decir “comisión por trabajo” como modelo de Quira?

---

## 18. Dónde vive el producto

| Pieza | Qué es |
|-------|--------|
| App móvil Quira | Experiencia completa (clientes y profesionales) |
| [quira.app](https://quira.app) | Landing / explicación pública y privacidad |
| Backend Quira | Motor de cuentas, anuncios, propuestas, pagos de suscripción, IA y avisos |

Si necesitas afinar un mensaje concreto (App Store, LinkedIn, email a pros, guion de demo), este documento es la fuente de verdad de **comportamiento de producto**. Los detalles de implementación viven en la documentación técnica del equipo de ingeniería.
