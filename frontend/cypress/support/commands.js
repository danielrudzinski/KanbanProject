// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })


Cypress.Commands.add('login', (email, password) => {
  cy.visit('/');
  cy.get('input[type="email"]').first().type(email);
  cy.get('input[type="password"]').first().type(password);
  cy.contains('button', 'Sign In').click();
  cy.url().should('include', '/board');
  cy.wait(300);
});
  
Cypress.Commands.add('createColumn', (name, wipLimit) => {
  cy.contains('button', 'Dodaj wiersz/kolumnę').click();
  cy.wait(500);
  cy.contains('label', 'Nazwa kolumny:').next('input').type(name);
  if (wipLimit > 0) {
    cy.contains('label', 'Limit WIP').next('input').type(wipLimit);
  }
  cy.contains('button', 'Dodaj kolumnę').click();
  cy.contains('th', name).should('exist');
  cy.wait(300);
});
  
Cypress.Commands.add('createRow', (name, wipLimit) => {
  cy.contains('button', 'Dodaj wiersz/kolumnę').click();
  cy.wait(500);

  cy.contains('button', 'Wiersze').click();
  cy.wait(500);
    
  cy.get('#item-name').clear().type(name);
  if (wipLimit > 0) {
    cy.get('#wip-limit').clear().type(wipLimit);
  }
    
  cy.get('[type="submit"]').click();

  cy.contains('tr', name).should('exist');
  cy.wait(300);
});
  
Cypress.Commands.add('createTask', (title) => {
    cy.wait(100);
    cy.contains('button', 'Dodaj zadanie').click();
    cy.get('#task-title').type(title);
    cy.get('[type="submit"]').click();
    cy.contains('.task', title).should('exist');
    cy.wait(300);
  });
  
Cypress.Commands.add('drag', { prevSubject: 'element' }, (subject, targetSelector) => {
  const target = cy.get(targetSelector);
    
  const dataTransfer = {
    data: {},
    setData(format, data) {
      this.data[format] = data;
      this.types.push(format);
    },
    getData(format) {
      return this.data[format];
    },
    clearData() {
      this.data = {};
      this.types = [];
    },
    types: []
  };
    
  cy.wrap(subject).trigger('mousedown', { which: 1 });
  cy.wrap(subject).trigger('dragstart', { dataTransfer });
    
  target.trigger('dragover', { dataTransfer });
  target.trigger('drop', { dataTransfer });
    
  cy.wrap(subject).trigger('dragend', { dataTransfer });
  cy.wait(300);
});

Cypress.Commands.add('createTestBoard', () => {
  cy.createColumn('To Do', 3);
  cy.wait(100);
  cy.createColumn('In Progress', 2);
  cy.wait(100);
  cy.createColumn('Done', 0);
  cy.wait(100);
  cy.createRow('Features', 3);
  cy.wait(100);
  cy.createRow('Bugs', 3);
  cy.wait(300);
});
  
Cypress.Commands.add('setupTaskWithSubtasks', (title, subtasks = []) => {
  cy.createTask(title);
  cy.contains('.task', title).click();
    
  subtasks.forEach(subtask => {
    cy.get('input[placeholder="Nazwa podzadania"]').type(`${subtask}`);
    cy.wait(300);
    cy.get('.add-subtask-btn').click();
  });
    
  cy.get('.close-panel-btn').click();
  cy.wait(300);
});

Cypress.Commands.add('deleteTasks', () => {
  cy.get('body').then($body => {
    if ($body.find('.task').length > 0) {
      cy.get('.delete-btn').first().click();
      cy.wait(100);
      cy.get('body').then($newBody => {
        if ($newBody.find('[title="Usuń zadanie"]').length > 0) {
          cy.get('.confirm-delete-btn').click({ force: true });
          cy.wait(300);
          cy.deleteTasks();
        }
      });
    }
  });
  cy.wait(300);
});

Cypress.Commands.add('deleteColumns', () => {
  cy.get('th').then($columns => {
    if ($columns.length > 2) {
      cy.get('th').eq(2).find('.delete-column-btn').click({ force: true });
      cy.wait(300);
      cy.deleteColumns();
    }
  });
  cy.wait(300);
});

Cypress.Commands.add('deleteRows', () => {
  cy.get('.grid-row-header').then($rowHeaders => {
    if ($rowHeaders.length > 1) {
      cy.get('.grid-row-header').eq(1).find('.delete-row-btn').click({ force: true });
      cy.wait(300);
      cy.deleteRows(); 
    }
  });
  cy.wait(300);
});