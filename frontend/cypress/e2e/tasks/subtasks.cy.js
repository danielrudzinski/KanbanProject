beforeEach(() => {
  cy.login('rlb97355@jioso.com', 'qwer123');
  cy.wait(300);
});

afterEach(() => {
    cy.on('window:alert', () => true);
    cy.on('window:confirm', () => true);
    cy.get('body').type('{esc}');
  
    cy.deleteTasks();
    cy.deleteColumns();
    cy.deleteRows();
});

describe('Subtasks', () => {
  it('creates subtasks within a task', () => {
    cy.setupTaskWithSubtasks('Parent Task', ['Subtask 1', 'Subtask 2', 'Subtask 3']);
      
    cy.contains('.task', 'Parent Task').click();
    cy.get('.subtask-item').should('have.length', 3);
    cy.contains('.subtask-item', 'Subtask 1').should('exist');
    cy.contains('.subtask-item', 'Subtask 2').should('exist');
    cy.contains('.subtask-item', 'Subtask 3').should('exist');
    cy.get('.close-panel-btn').click();
  });
  
  it('marks subtasks as complete', () => {
    cy.setupTaskWithSubtasks('Completion Task', ['Mark me complete']);
      
    cy.wait(300);
    cy.contains('.task', 'Completion Task').click();
    cy.wait(300);
    cy.contains('.subtask-item', 'Mark me complete').find('input[type="checkbox"]').check();
    cy.wait(300);
    cy.contains('.subtask-item', 'Mark me complete').find('label').should('have.class', 'completed');
      

      
    cy.get('.close-panel-btn').click();
  });
  
  it('deletes subtasks', () => {
    cy.setupTaskWithSubtasks('Deletion Task', ['Delete me']);
      
    cy.contains('.task', 'Deletion Task').click();
    cy.contains('.subtask-item', 'Delete me').find('.delete-subtask-btn').click();
    cy.get('.confirm-btn').click();
    cy.contains('.subtask-item', 'Delete me').should('not.exist');
      
    cy.get('.close-panel-btn').click();
  });
  
});