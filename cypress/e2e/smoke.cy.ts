/**
 * Smoke E2E: flujos críticos con API simulada (sin backend real).
 * Ejecutar con: npm run dev (puerto 5173) y en otra terminal: npm run test.e2e
 */
describe('Quira — smoke E2E', () => {
  describe('Rutas públicas', () => {
    it('redirige / a /login', () => {
      cy.visit('/');
      cy.url().should('include', '/login');
    });

    it('login muestra marca y CTA', () => {
      cy.visit('/login');
      cy.contains('Quira');
      cy.contains('Tú descansa, Quira se encarga');
      cy.contains('Entrar');
      cy.get('input[type="email"]').should('exist');
      cy.get('input[type="password"]').should('exist');
    });

    it('navega a registro desde login', () => {
      cy.visit('/login');
      cy.contains('Regístrate con Email').click();
      cy.url().should('include', '/register');
      cy.contains('Crea tu cuenta');
    });

    it('muestra recuperar contraseña', () => {
      cy.visit('/forgot-password');
      cy.contains('Recuperar contraseña');
      cy.contains('¿Olvidaste tu contraseña?');
    });
  });

  describe('Cliente (sesión simulada)', () => {
    it('muestra Inicio y saludo con nombre', () => {
      cy.seedSession('client');
      cy.contains('Inicio', { matchCase: false }).should('exist');
      cy.contains('Hola, Cliente', { matchCase: false }).should('exist');
    });

    it('no muestra pestaña Mercado al ser cliente', () => {
      cy.seedSession('client');
      cy.get('ion-tab-button[href="/market"]').should('not.exist');
    });

    it('abre nueva solicitud', () => {
      cy.seedSession('client');
      cy.visit('/new-request');
      cy.contains('Nueva Solicitud');
    });

    it('carga detalle de solicitud mock', () => {
      cy.seedSession('client');
      cy.visit('/request/1');
      cy.contains('Solicitud mock E2E', { timeout: 15000 });
    });
  });

  describe('Profesional (sesión simulada)', () => {
    it('muestra pestañas Mercado y Gestión', () => {
      cy.seedSession('pro');
      cy.get('ion-tab-button[href="/market"]').should('exist');
      cy.get('ion-tab-button[href="/my-work"]').should('exist');
    });

    it('navega a Mercado', () => {
      cy.seedSession('pro');
      cy.visit('/market');
      cy.contains('Mercado');
      cy.contains('Encuentra nuevas oportunidades');
    });

    it('navega a Mi trabajo', () => {
      cy.seedSession('pro');
      cy.visit('/my-work');
      cy.contains('Mi Trabajo');
      cy.contains('Propuestas (0)');
    });

    it('abre directorio de profesionales', () => {
      cy.seedSession('pro');
      cy.visit('/directory');
      cy.contains('Directorio');
    });

    it('abre detalle de directorio', () => {
      cy.seedSession('pro');
      cy.visit('/directory/10');
      cy.contains('Pro Directorio E2E', { timeout: 15000 });
    });
  });

  describe('Mejora de plan', () => {
    it('muestra pantalla Become Pro', () => {
      cy.visit('/become-pro');
      cy.contains('Elige tu Nivel', { timeout: 10000 });
    });
  });

  describe('Login con API simulada (email + contraseña)', () => {
    it('tras Entrar llega a la lista de solicitudes', () => {
      cy.visit('/login');
      cy.get('input[type="email"]').clear().type('login@e2e.quira');
      cy.get('input[type="password"]').type('cualquier');
      cy.get('.login-btn').click();
      cy.url({ timeout: 20000 }).should('include', '/request-list');
      cy.contains('Hola, Login', { matchCase: false }).should('exist');
    });
  });
});
