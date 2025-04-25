afterEach(() => {
  cy.on('window:alert', () => true);
  cy.on('window:confirm', () => true);
  cy.get('body').type('{esc}');

  cy.deleteTasks();
  cy.deleteColumns();
  cy.deleteRows();
});

describe('Complete User Journey', () => {
  it('allows a user to set up and use a kanban board', () => {
    cy.visit('/');
    cy.wait(1000);
    cy.login('rlb97355@jioso.com', 'qwer123');
    cy.wait(1000);
    cy.createColumn('Backlog', 0);
    cy.createColumn('In Progress', 3);
    cy.createColumn('Done', 0);

    cy.createRow('Features', 4);
    cy.createRow('Bugs', 2);
      
    cy.wait(1000);
    cy.get('.header-nav > :nth-child(1)').click();
    cy.get('#task-title').type('Implement login');
    cy.get('[type="submit"]').click();
      
    cy.contains('.task', 'Implement login').drag('th:contains("In Progress")');
    cy.wait(300);
    cy.contains('.task', 'Implement login').click();
    cy.get('input[placeholder="Nazwa podzadania"]').type('Create UI{enter}');
    cy.wait(300);
    cy.get('.add-subtask-btn').click();
    cy.get('input[placeholder="Nazwa podzadania"]').type('Validate inputs{enter}');
    cy.wait(300);
    cy.get('.add-subtask-btn').click();

    cy.get('.subtask-item').first().find('input[type="checkbox"]').check();

    cy.get('.close-panel-btn').click();
      
    cy.createTask('Fix bug #123');
    cy.contains('.task', 'Fix bug #123').drag('th:contains("In Progress")');

    cy.createTask('Update docs');
    cy.contains('.task', 'Update docs').drag('th:contains("In Progress")');

    cy.createTask('WIP limit test');
    cy.contains('.task', 'WIP limit test').drag('th:contains("In Progress")');

      
    cy.get('th:contains("In Progress")').find('.wip-limit.exceeded').should('exist');
  });
});