beforeEach(() => {
  cy.wait(500);
  cy.login('rlb97355@jioso.com', 'qwer123');
});

afterEach(() => {
  cy.on('window:alert', () => true);
  cy.on('window:confirm', () => true);
  
  cy.deleteTasks();
  cy.deleteColumns();
  cy.deleteRows();
});

describe('Row Management', () => {
  it('allows creating a new row', () => {
    cy.contains('button', 'Dodaj wiersz/kolumnę').click();
    cy.contains('button', 'Wiersze').click();
    cy.get('#item-name').type('New Test Row');
    cy.get('#wip-limit').type('5');
    cy.get('[type="submit"]').click();
    cy.contains('tr', 'New Test Row').should('exist');
  });

  it('allows deleting a row', () => {
    cy.createRow('Delete Me Row', 0);
    cy.wait(300);
    cy.contains('.grid-row-header', 'Delete Me Row').find('.delete-row-btn').click();
    cy.contains('.grid-row-header', 'Delete Me Row').should('not.exist');
  });

  it('allows editing row name', () => {
    cy.createRow('Edit Row Test', 3);
    cy.contains('tr', 'Edit Row Test')
    .find('.editable-text')
    .dblclick({force: true});
    cy.get('input').clear().type('Updated Row Name{enter}');
    cy.contains('.grid-row-header', 'Updated Row Name').should('exist');
  });

  it('enforces WIP limits on rows', () => {
    cy.createColumn('Test Column', 0);
    cy.createRow('Limited Row', 2);

    cy.createTask('Row Task 1');
    cy.createTask('Row Task 2');
    cy.createTask('Row Task 3');

    cy.contains('.task', 'Row Task 1').drag('tr:contains("Limited Row")');
    cy.contains('.task', 'Row Task 2').drag('tr:contains("Limited Row")');
    cy.contains('.task', 'Row Task 3').drag('tr:contains("Limited Row")');
    
    cy.get('tr:contains("Limited Row")').find('.wip-limit.exceeded').should('exist');
  });

});