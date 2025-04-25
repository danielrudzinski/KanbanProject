beforeEach(() => {
  cy.login('rlb97355@jioso.com', 'qwer123');
});

describe('Logout Functionality', () => {
  it('logs out successfully', () => {
    cy.get('.logout-btn').click();
    
    cy.get(':nth-child(1) > input').should('be.visible');
    cy.get(':nth-child(2) > input').should('be.visible');
  });

  it('clears auth token on logout', () => {
    cy.get('.logout-btn').click();
    
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.be.null;
    });
  });

  it('redirects to login when accessing protected route after logout', () => {
    cy.get('.logout-btn').click();

    cy.visit('/board');
    
    cy.url().should('include', '/');
  });
});