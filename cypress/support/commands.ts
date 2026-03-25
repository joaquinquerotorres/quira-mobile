/// <reference types="cypress" />

import { registerDefaultApiMocks as wireDefaultApiMocks } from './apiMocks';

Cypress.Commands.add('registerDefaultApiMocks', () => {
  wireDefaultApiMocks();
});

Cypress.Commands.add('seedSession', (role: 'client' | 'pro') => {
  const fixtureName = role === 'pro' ? 'user-pro' : 'user-client';
  cy.fixture(fixtureName).then((user: Record<string, unknown>) => {
    cy.visit('/request-list', {
      onBeforeLoad(win) {
        win.localStorage.setItem('quira_token', 'e2e-test-jwt');
        win.localStorage.setItem('user', JSON.stringify(user));
      },
    });
  });
});

export {};

declare global {
  namespace Cypress {
    interface Chainable {
      registerDefaultApiMocks(): Chainable<void>;
      seedSession(role: 'client' | 'pro'): Chainable<void>;
    }
  }
}
