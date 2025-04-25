beforeEach(() => {
  cy.login('rlb97355@jioso.com', 'qwer123');
});

afterEach(() => {
  cy.on('window:alert', () => true);
  cy.on('window:confirm', () => true);
  cy.get('body').type('{esc}');
      
  cy.deleteTasks();
  cy.deleteColumns();
  cy.deleteRows();
});

describe('Task Movement', () => {
  it('moves a task between columns', () => {
    cy.createColumn('In Progress', 0);
    cy.createColumn('Done for moving test case', 0);
    cy.createTask('Movable Task');

    cy.contains('.task', 'Movable Task').should('be.visible');

    cy.contains('.task', 'Movable Task').drag('th:contains("In Progress")');
    cy.wait(500);

    cy.get('th:contains("In Progress")').parents('table')
      .contains('.task', 'Movable Task').should('exist');

    cy.contains('.task', 'Movable Task').drag('th:contains("Done for moving test case")');
    cy.wait(500);

    cy.get('th:contains("Done for moving test case")').parents('table')
      .contains('.task', 'Movable Task').should('exist');
  });
  
  it('moves a task between rows', () => {
    cy.createRow('Bugs for moving test case', 0);
    cy.createTask('Movable Task');
    cy.wait(100);
    cy.contains('.task', 'Movable Task').should('be.visible');
      
    cy.contains('.task', 'Movable Task').drag('tr:contains("Bugs for moving test case")');
    cy.wait(500);
      
    cy.contains('tr', 'Bugs for moving test case').parents('table')
      .contains('.task', 'Movable Task').should('exist');
  });
  
});