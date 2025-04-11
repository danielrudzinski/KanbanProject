describe('Kanban Board', () => {
    beforeEach(() => {
      cy.visit('/');
    });
  
    it('loads the board correctly', () => {
      cy.contains('Tablica Kanban');
      cy.get('.board-grid').should('be.visible');
      cy.get('th').should('have.length.at.least', 3); // Check columns
      cy.get('td.grid-row-header').should('have.length.at.least', 2); // Check rows
    });
    
    it('displays tasks on the board', () => {
      cy.get('.task').should('exist');
    });
  });