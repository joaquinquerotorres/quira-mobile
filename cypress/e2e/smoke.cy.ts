/**
 * Smoke E2E: flujos críticos con API simulada (sin backend real).
 * Ejecutar con: npm run dev (puerto 5173) y en otra terminal: npm run test.e2e
 *
 * Stripe Checkout simulado + mercado (sync, refetch usuario, can-bid): ver
 * cypress/e2e/stripe-checkout-market.cy.ts → npm run test.e2e:stripe
 */
describe('Quira — smoke E2E', () => {
  describe('Rutas públicas', () => {
    it('redirige / a /login', () => {
      cy.visit('/');
      cy.location('pathname', { timeout: 20000 }).should('eq', '/login');
    });

    it('login muestra marca y CTA', () => {
      cy.visit('/login');
      cy.contains('Quira', { timeout: 20000 }).should('be.visible');
      cy.contains('Tú descansa, Quira se encarga', { timeout: 20000 }).should('be.visible');
      cy.contains('Entrar', { timeout: 20000 }).should('be.visible');
      cy.get('input[type="email"]', { timeout: 20000 }).should('exist');
      cy.get('input[type="password"]', { timeout: 20000 }).should('exist');
    });

    it('navega a registro desde login', () => {
      cy.visit('/login');
      cy.contains('Regístrate con Email', { timeout: 20000 }).click();
      cy.location('pathname', { timeout: 20000 }).should('include', '/register');
      cy.contains('Crea tu cuenta', { timeout: 20000 }).should('be.visible');
    });

    it('muestra recuperar contraseña', () => {
      cy.visit('/forgot-password');
      cy.contains('Recuperar contraseña', { timeout: 20000 }).should('be.visible');
      cy.contains('¿Olvidaste tu contraseña?', { timeout: 20000 }).should('be.visible');
    });
  });

  describe('Cliente (sesión simulada)', () => {
    it('muestra Inicio y saludo con nombre', () => {
      cy.seedSession('client');
      cy.contains('Inicio', { matchCase: false, timeout: 20000 }).should('exist');
      cy.contains('Hola, Cliente', { matchCase: false, timeout: 20000 }).should('exist');
    });

    it('no muestra pestaña Mercado al ser cliente', () => {
      cy.seedSession('client');
      cy.get('ion-tab-button[href="/market"]').should('not.exist');
    });

    it('abre nueva solicitud', () => {
      cy.seedSession('client');
      cy.visit('/new-request');
      cy.contains('Nueva Solicitud', { timeout: 20000 }).should('be.visible');
    });

    it('carga detalle de solicitud mock', () => {
      cy.seedSession('client');
      cy.visit('/request/1');
      cy.contains('Solicitud mock E2E', { timeout: 20000 }).should('be.visible');
    });
  });

  describe('Profesional (sesión simulada)', () => {
    it('muestra pestañas Mercado y Gestión', () => {
      cy.seedSession('pro');
      cy.get('ion-tab-button[href="/market"]', { timeout: 20000 }).should('exist');
      cy.get('ion-tab-button[href="/my-work"]', { timeout: 20000 }).should('exist');
    });

    it('navega a Mercado', () => {
      cy.seedSession('pro');
      cy.visit('/market');
      cy.contains('Mercado', { timeout: 20000 }).should('be.visible');
      cy.contains('Encuentra nuevas oportunidades', { timeout: 20000 }).should('be.visible');
    });

    it('navega a Mi trabajo', () => {
      cy.seedSession('pro');
      cy.visit('/my-work');
      cy.contains('Mi Trabajo', { timeout: 20000 }).should('be.visible');
      cy.contains('Propuestas (0)', { timeout: 20000 }).should('be.visible');
    });

    it('abre directorio de profesionales', () => {
      cy.seedSession('pro');
      cy.visit('/directory');
      cy.contains('Directorio', { timeout: 20000 }).should('be.visible');
    });

    it('abre detalle de directorio', () => {
      cy.seedSession('pro');
      cy.visit('/directory/10');
      cy.contains('Pro Directorio E2E', { timeout: 20000 }).should('be.visible');
    });
  });

  describe('Mejora de plan', () => {
    it('muestra pantalla Become Pro', () => {
      cy.visit('/become-pro');
      cy.contains('Elige tu Nivel', { timeout: 20000 }).should('be.visible');
    });
  });

  describe('Login con API simulada (email + contraseña)', () => {
    it('tras Entrar llega a la lista de solicitudes', () => {
      cy.visit('/login');
      cy.get('input[type="email"]', { timeout: 20000 }).clear().type('login@e2e.quira');
      cy.get('input[type="password"]', { timeout: 20000 }).type('cualquier');
      cy.get('.login-btn').click();
      cy.url({ timeout: 20000 }).should('include', '/request-list');
      cy.contains('Hola, Login', { matchCase: false, timeout: 20000 }).should('exist');
    });
  });
});
