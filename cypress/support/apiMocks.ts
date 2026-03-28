/// <reference types="cypress" />

/**
 * Respuestas API por defecto para E2E sin backend real.
 * Rutas más concretas se resuelven antes que la colección vacía.
 */
export function registerDefaultApiMocks(): void {
  cy.intercept('GET', '**/api/**', (req) => {
    const u = req.url;

    if (u.includes('/users?') && u.includes('email=')) {
      return req.reply({ fixture: 'users-by-email-hydra.json' });
    }

    if (u.includes('/requests') && u.includes('is_market')) {
      return req.reply({ fixture: 'market-requests.json' });
    }

    if (u.includes('/professionals/me/can-bid')) {
      return req.reply({ body: { canBidThisMonth: true } });
    }

    const userPath = u.match(/\/users\/(\d+)(?:\?|$)/);
    if (userPath) {
      const id = userPath[1];
      if (id === '1') {
        return req.reply({ fixture: 'user-client.json' });
      }
      return req.reply({ fixture: 'user-pro.json' });
    }

    if (/\/professional_profiles\/\d+/.test(u) && !u.includes('professional_profiles?')) {
      return req.reply({ fixture: 'professional-profile-detail.json' });
    }

    if (/\/requests\/\d+/.test(u) && !u.includes('/requests?')) {
      return req.reply({ fixture: 'request-detail.json' });
    }

    if (u.includes('/reviews')) {
      return req.reply({ fixture: 'hydra-empty.json' });
    }

    if (u.includes('/request_questions')) {
      return req.reply({ fixture: 'hydra-empty.json' });
    }

    return req.reply({ fixture: 'hydra-empty.json' });
  }).as('apiGet');

  cy.intercept('POST', '**/api/**', (req) => {
    const u = req.url;
    if (u.includes('login_check')) {
      return req.reply({ statusCode: 200, body: { token: 'e2e-test-jwt' } });
    }
    if (u.includes('stripe/sync-subscription')) {
      return req.reply({ statusCode: 200, body: {} });
    }
    return req.reply({ statusCode: 201, body: {} });
  }).as('apiPost');

  cy.intercept('PATCH', '**/api/**', { statusCode: 200, body: {} }).as('apiPatch');
  cy.intercept('DELETE', '**/api/**', { statusCode: 204, body: null }).as('apiDelete');
}
