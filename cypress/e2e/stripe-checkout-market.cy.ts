/**
 * E2E: retorno simulado de Stripe Checkout + mercado con API mockeada.
 *
 * Ejecución: `npm run dev` + `npm run test.e2e:stripe`
 * (puerto debe coincidir con cypress.config baseUrl, p. ej. 5173).
 */
describe('Stripe checkout simulado y mercado', () => {
  it('tras ?success=1 llama sync, refresca usuario con paidThroughAt y va a /market', () => {
    cy.intercept('POST', '**/stripe/sync-subscription', { statusCode: 200, body: {} }).as(
      'stripeSync',
    );
    cy.intercept('GET', '**/api/users/2', { fixture: 'user-pro.json' }).as('userRefresh');

    cy.fixture('user-pro-expired').then((user: Record<string, unknown>) => {
      cy.visit('/become-pro?success=1', {
        onBeforeLoad(win) {
          win.localStorage.setItem('quira_token', 'e2e-test-jwt');
          win.localStorage.setItem('user', JSON.stringify(user));
        },
      });
    });

    cy.wait('@stripeSync', { timeout: 20000 });
    cy.wait('@userRefresh', { timeout: 20000 });

    cy.window().then((win) => {
      const raw = win.localStorage.getItem('user');
      expect(raw, 'usuario en localStorage tras refetch').to.be.a('string');
      const parsed = JSON.parse(raw!) as { paidThroughAt?: string | null };
      expect(parsed.paidThroughAt, 'paidThroughAt actualizado desde GET /users/2').to.match(/2099/);
    });

    cy.location('pathname', { timeout: 15000 }).should('eq', '/market');
    cy.contains('E2E fontanería mercado', { timeout: 20000 }).should('be.visible');
  });

  it('mercado: PRO con suscripción abre modal de propuesta desde ME INTERESA', () => {
    cy.seedSession('pro');
    cy.visit('/market');
    cy.contains('E2E fontanería mercado', { timeout: 20000 }).should('be.visible');
    cy.contains('ME INTERESA').click();
    cy.contains('ENVIAR PROPUESTA', { timeout: 15000 }).should('be.visible');
  });

  it('mercado: ex-PRO sin paidThroughAt consulta can-bid antes del modal', () => {
    cy.intercept('GET', '**/professionals/me/can-bid', { body: { canBidThisMonth: true } }).as(
      'canBid',
    );

    cy.fixture('user-pro-expired').then((user: Record<string, unknown>) => {
      cy.visit('/market', {
        onBeforeLoad(win) {
          win.localStorage.setItem('quira_token', 'e2e-test-jwt');
          win.localStorage.setItem('user', JSON.stringify(user));
        },
      });
    });

    cy.contains('E2E fontanería mercado', { timeout: 20000 }).should('be.visible');
    cy.contains('ME INTERESA').click();
    cy.wait('@canBid', { timeout: 15000 });
    cy.contains('ENVIAR PROPUESTA', { timeout: 15000 }).should('be.visible');
  });
});
