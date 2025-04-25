beforeEach(() => {
  cy.wait(500);
  cy.login('rlb97355@jioso.com', 'qwer123');
});

afterEach(() => {
  cy.on('window:alert', () => true);
  cy.on('window:confirm', () => true);

  cy.deleteTasks();
  cy.wait(500);
  cy.deleteColumns();
  cy.wait(500);
  cy.deleteRows();
  cy.wait(500);
});

describe('Column Management', () => {
  it('allows creating a new column', () => {
    cy.contains('button', 'Dodaj wiersz/kolumnę').click();
    cy.contains('label', 'Nazwa kolumny:').should('be.visible');
    cy.get('#item-name').type('New Test Column');
    cy.get('#wip-limit').type('3');
    cy.contains('button', 'Dodaj kolumnę').click();
    cy.contains('th', 'New Test Column').should('exist');
  });
  
  it('allows editing column name', () => {
    cy.createColumn('Edit Test', 3);
    cy.contains('th', 'Edit Test')
    .find('.editable-text')
    .dblclick({force: true});
  cy.get('input').clear().type('Updated Column{enter}');
  cy.contains('th', 'Updated Column').should('exist');
  });
  
  it('enforces WIP limits on columns', () => {
    cy.createColumn('Limited', 2);
    cy.createRow('Test Row', 0);
    cy.createTask('Task 1');
    cy.createTask('Task 2');
    
    cy.contains('.task', 'Task 1').drag('th:contains("Limited")');
    cy.contains('.task', 'Task 2').drag('th:contains("Limited")');
    
    cy.createTask('Task 3');
    cy.contains('.task', 'Task 3').drag('th:contains("Limited")');
    
    cy.get('th:contains("Limited")').find('.wip-limit.exceeded').should('exist');
  });
    
});