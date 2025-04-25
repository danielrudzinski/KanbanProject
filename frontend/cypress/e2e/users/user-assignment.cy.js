beforeEach(() => {
  cy.login('rlb97355@jioso.com', 'qwer123');
});

afterEach(() => {
  cy.on('window:alert', () => true);
  cy.on('window:confirm', () => true);
  cy.get('body').type('{esc}');
  
  cy.get('body').then($body => {
    if ($body.find('.close-panel-btn').length) {
      cy.get('.close-panel-btn').click();
    }
  });

  cy.deleteTasks();
  cy.deleteColumns();
  cy.deleteRows();
});

describe('User Assignment', () => {
  
  it('allows assigning a user to a task', () => {
    cy.createTask('Assignment Test Task');
      
    cy.contains('.task', 'Assignment Test Task').click();
    cy.wait(500);

    cy.get('.assign-user-icon > svg').click();
    cy.wait(300);
    cy.get('select').select('User One');
    cy.wait(300);
    cy.get('.assign-btn').click();
    cy.wait(300);
    cy.get('.user-avatar > .avatar-preview').should('exist');

    cy.get('.close-panel-btn').click();
      
    cy.contains('.task', 'Assignment Test Task').get('.avatar-preview').should('exist');
  });
  
  it('allows removing user assignment', () => {
    cy.createTask('Remove Assignment Task');
    cy.contains('.task', 'Remove Assignment Task').click();

    cy.get('.assign-user-icon > svg').click();
    cy.wait(100);
    cy.get('select').select('User One');
    cy.wait(100);
    cy.get('.assign-btn').click();
    cy.wait(100);
    cy.get('.user-avatar > .avatar-preview').should('exist');
      
    cy.get('.remove-user-btn').click();
    cy.wait(100);
    cy.get('.confirm-btn').click();
      
    cy.get('.user-avatar > .avatar-preview').should('not.exist');
    cy.get('.close-panel-btn').click();
  });

});