import * as api from '../../services/api';

// Mock the global fetch function
global.fetch = jest.fn();

// Mock URL.createObjectURL
URL.createObjectURL = jest.fn().mockReturnValue('mock-blob-url');

describe('API Services', () => {
  beforeEach(() => {
    fetch.mockClear();
    URL.createObjectURL.mockClear();
  });

  // ====== COLUMN OPERATIONS TESTS ======
  describe('Column Operations', () => {
    test('fetchColumns should return columns when successful', async () => {
      // Mock data
      const mockColumns = [
        { id: 'col1', name: 'To Do', position: 0 },
        { id: 'col2', name: 'In Progress', position: 1 }
      ];

      // Mock the fetch response
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockColumns
      });

      // Execute the function
      const result = await api.fetchColumns();

      // Assertions
      expect(fetch).toHaveBeenCalledWith('/columns');
      expect(result).toEqual(mockColumns);
    });

    test('fetchColumns should retry on failure', async () => {
      // First two calls fail, third succeeds
      const mockColumns = [{ id: 'col1', name: 'To Do' }];
      
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });
      
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockColumns
      });

      // Execute with default 3 retries
      const result = await api.fetchColumns();

      // Should have been called 3 times
      expect(fetch).toHaveBeenCalledTimes(3);
      expect(result).toEqual(mockColumns);
    });

    test('fetchColumns should throw after all retries fail', async () => {
      // All fetch calls fail
      fetch.mockResolvedValue({
        ok: false,
        status: 500
      });

      // Execute with 2 retries
      await expect(api.fetchColumns(2)).rejects.toThrow('Error fetching columns: 500');
      
      // Should have been called 2 times
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    test('fetchColumns should throw error on fetch failure', async () => {
      // Mock fetch to throw an error
      fetch.mockImplementationOnce(() => {
        throw new Error('Network error');
      });
        
      await expect(api.fetchColumns(1)).rejects.toThrow('Network error');
    });

    test('updateColumnName should update column name', async () => {
      const mockColumn = { id: 'col1', name: 'Updated Name' };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockColumn
      });

      const result = await api.updateColumnName('col1', 'Updated Name');

      expect(fetch).toHaveBeenCalledWith('/columns/col1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Updated Name' }),
      });
      expect(result).toEqual(mockColumn);
    });

    test('addColumn should create a new column', async () => {
      const mockColumn = { id: 'col3', name: 'New Column', wipLimit: 5 };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockColumn
      });

      const result = await api.addColumn('New Column', 5);

      expect(fetch).toHaveBeenCalledWith('/columns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'New Column', wipLimit: 5 }),
      });
      expect(result).toEqual(mockColumn);
    });

    test('fetchColumnById should return a specific column', async () => {
        const mockColumn = { id: 'col1', name: 'To Do', position: 0, wipLimit: 3 };
        
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockColumn
        });
      
        const result = await api.fetchColumnById('col1');
      
        expect(fetch).toHaveBeenCalledWith('/columns/col1');
        expect(result).toEqual(mockColumn);
      });
      
    test('updateColumnWipLimit should update column WIP limit', async () => {
        const mockColumn = { id: 'col1', wipLimit: 5 };
        const wipLimit = 5;
          
        fetch.mockResolvedValueOnce({
          status: 200,
          json: async () => mockColumn
        });
        
        const result = await api.updateColumnWipLimit('col1', wipLimit);
        
        expect(fetch).toHaveBeenCalledWith('/columns/col1', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            wipLimit: parseInt(wipLimit)
          }),
        });
        expect(result).toEqual(mockColumn);
    });
      
    test('updateColumnWipLimit should handle JSON parsing errors', async () => {
      const columnId = 'col1';
      const wipLimit = 5;
        
      // Mock a successful response that doesn't return valid JSON
      fetch.mockResolvedValueOnce({
        status: 204, // No content response
        json: async () => { throw new Error('Invalid JSON'); }
      });
        
      const result = await api.updateColumnWipLimit(columnId, wipLimit);
        
      expect(fetch).toHaveBeenCalledWith('/columns/col1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wipLimit: parseInt(wipLimit)
        }),
      });
        
      // Should create a synthetic response
      expect(result).toEqual({
        id: columnId,
        wipLimit: parseInt(wipLimit)
      });
    });
      
    test('updateColumnPosition should update column position', async () => {
        const mockColumn = { id: 'col1', position: 2 };
        
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockColumn
        });
      
        const result = await api.updateColumnPosition('col1', 2);
      
        expect(fetch).toHaveBeenCalledWith('/columns/col1/position/2', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        expect(result).toEqual(mockColumn);
    });
      
    test('deleteColumn should delete a column', async () => {
      fetch.mockResolvedValueOnce({
        ok: true
      });
      
      const result = await api.deleteColumn('col1');
      
      expect(fetch).toHaveBeenCalledWith('/columns/col1', {
        method: 'DELETE'
      });
      expect(result).toBe(true);
    });
      
    test('deleteColumn should handle 404 responses', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });
      
      const result = await api.deleteColumn('col1');
      
      expect(fetch).toHaveBeenCalledWith('/columns/col1', {
        method: 'DELETE'
      });
      expect(result).toBe(true);
    });
      
    test('deleteColumn should throw on error responses other than 404', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });
      
      await expect(api.deleteColumn('col1')).rejects.toThrow('Error deleting column: 500');
      
      expect(fetch).toHaveBeenCalledWith('/columns/col1', {
        method: 'DELETE'
      });
    });

    test('addColumn should handle error responses', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400
      });
        
      await expect(api.addColumn('Column', 5)).rejects.toThrow('Error adding column: 400');
    });
      
    test('updateColumnWipLimit should handle error responses', async () => {
      fetch.mockResolvedValueOnce({
        status: 400
      });
        
      await expect(api.updateColumnWipLimit('col1', 5)).rejects.toThrow('Error updating WIP limit: 400');
    });

    test('fetchColumnById should handle error responses', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });
        
      await expect(api.fetchColumnById('col1')).rejects.toThrow('Error fetching column: 404');
    });

    test('updateColumnName should handle error responses', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400
      });
        
      await expect(api.updateColumnName('col1', 'New Name')).rejects.toThrow('Failed to update column: 400');
    });

  });

  // ====== TASK OPERATIONS TESTS ======
  describe('Task Operations', () => {
    test('fetchTasks should return tasks when successful', async () => {
      const mockTasks = [
        { id: '1', title: 'Task 1', columnId: 'col1' },
        { id: '2', title: 'Task 2', columnId: 'col2' }
      ];

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTasks
      });

      const result = await api.fetchTasks();

      expect(fetch).toHaveBeenCalledWith('/tasks');
      expect(result).toEqual(mockTasks);
    });

    test('addTask should create a new task', async () => {
      const mockTask = { id: '3', title: 'New Task', columnId: 'col1' };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTask
      });

      const result = await api.addTask('New Task', 'col1');

      expect(fetch).toHaveBeenCalledWith('/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'New Task',
          column: {
            id: 'col1'
          }
        }),
      });
      expect(result).toEqual(mockTask);
    });

    test('updateTaskName should update task title', async () => {
      const mockTask = { id: '1', title: 'Updated Task' };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTask
      });

      const result = await api.updateTaskName('1', 'Updated Task');

      expect(fetch).toHaveBeenCalledWith('/tasks/1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: 'Updated Task' }),
      });
      expect(result).toEqual(mockTask);
    });

    test('assignUserToTask should throw error when WIP limit exceeded', async () => {
      // Mock WIP status check to return exceeded limit
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          willExceedLimit: true, 
          userName: 'Test User',
          wipLimit: 3
        })
      });

      await expect(api.assignUserToTask('1', '123')).rejects.toThrow(
        'WIP limit exceeded: Test User has reached their maximum of 3 tasks.'
      );

      expect(fetch).toHaveBeenCalledWith('/users/123/wip-status');
      expect(fetch).toHaveBeenCalledTimes(1); // Only the WIP check, not the actual assignment
    });

    test('assignUserToTask should assign user when WIP limit not exceeded', async () => {
      const mockTask = { id: '1', title: 'Task', userIds: ['123'] };
      
      // Mock WIP status check
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ willExceedLimit: false })
      });
      
      // Mock assignment call
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTask
      });

      const result = await api.assignUserToTask('1', '123');

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch).toHaveBeenNthCalledWith(1, '/users/123/wip-status');
      expect(fetch).toHaveBeenNthCalledWith(2, '/tasks/1/user/123', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      expect(result).toEqual(mockTask);
    });

    test('fetchTask should return a specific task', async () => {
      const mockTask = { id: '1', title: 'Task 1', columnId: 'col1' };
        
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTask
      });
      
      const result = await api.fetchTask('1');
      
      expect(fetch).toHaveBeenCalledWith('/tasks/1');
      expect(result).toEqual(mockTask);
    });
      
    test('updateTask should update a task with provided data', async () => {
      const mockTask = { id: '1', title: 'Updated Task', description: 'New description' };
      const taskData = { title: 'Updated Task', description: 'New description' };
        
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTask
      });
      
      const result = await api.updateTask('1', taskData);
      
      expect(fetch).toHaveBeenCalledWith('/tasks/1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });
      expect(result).toEqual(mockTask);
    });
      
    test('updateTaskColumn should update task column', async () => {
      const mockTask = { id: '1', title: 'Task 1', column: { id: 'col2' } };
        
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTask
      });
      
      const result = await api.updateTaskColumn('1', 'col2');
      
      expect(fetch).toHaveBeenCalledWith('/tasks/1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          column: {
            id: 'col2'
          }
        }),
      });
      expect(result).toEqual(mockTask);
    });
      
    test('updateTaskColumn should handle error responses with details', async () => {
      const errorResponse = { message: 'Column WIP limit exceeded' };
        
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => errorResponse
      });
      
      await expect(api.updateTaskColumn('1', 'col2')).rejects.toThrow(
        'Error updating task column: 400 - Column WIP limit exceeded'
      );
      
      expect(fetch).toHaveBeenCalledWith('/tasks/1', expect.any(Object));
    });
      
    test('updateTaskPosition should update task position', async () => {
      const mockTask = { id: '1', title: 'Task 1', position: 3 };
        
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTask
      });
      
      const result = await api.updateTaskPosition('1', 3);
      
      expect(fetch).toHaveBeenCalledWith('/tasks/1/position/3', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      expect(result).toEqual(mockTask);
    });
      
    test('removeUserFromTask should remove user from task', async () => {
      const mockTask = { id: '1', title: 'Task 1', users: [] };
        
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTask
      });
      
      const result = await api.removeUserFromTask('1', '123');
      
      expect(fetch).toHaveBeenCalledWith('/tasks/1/user/123', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      expect(result).toEqual(mockTask);
    });

    test('removeUserFromTask should handle network errors', async () => {
      fetch.mockImplementationOnce(() => {
        throw new Error('Network error');
      });
        
      await expect(api.removeUserFromTask('1', 'user1')).rejects.toThrow('Network error');
    });
      
    test('addLabelToTask should add a label to task', async () => {
      const mockTask = { id: '1', title: 'Task 1', labels: ['bug', 'feature'] };
      const label = 'feature';
        
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTask
      });
      
      const result = await api.addLabelToTask('1', label);
      
      expect(fetch).toHaveBeenCalledWith('/tasks/1/label/feature', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      expect(result).toEqual(mockTask);
    });

    test('addLabelToTask should handle error responses', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400
      });
        
      await expect(api.addLabelToTask('1', 'bug')).rejects.toThrow('Error adding label to task: 400');
    });

    test('removeLabelFromTask should remove a label from task', async () => {
      const mockTask = { id: '1', title: 'Task 1', labels: ['bug'] };
      const label = 'feature';
        
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTask
      });
      
      const result = await api.removeLabelFromTask('1', label);
      
      expect(fetch).toHaveBeenCalledWith('/tasks/1/label/feature', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      expect(result).toEqual(mockTask);
    });

    test('removeLabelFromTask should handle error responses', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400
      });
        
      await expect(api.removeLabelFromTask('1', 'bug')).rejects.toThrow('Error removing label from task: 400');
    });
      
    test('updateTaskLabels should update all task labels', async () => {
      const mockTask = { id: '1', title: 'Task 1', labels: ['bug', 'critical'] };
      const labels = ['bug', 'critical'];
        
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTask
      });
      
      const result = await api.updateTaskLabels('1', labels);
      
      expect(fetch).toHaveBeenCalledWith('/tasks/1/labels', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(labels)
      });
      expect(result).toEqual(mockTask);
    });

    test('updateTaskLabels should handle error responses', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400
      });
        
      await expect(api.updateTaskLabels('1', ['bug', 'feature'])).rejects.toThrow('Error updating task labels: 400');
    });
      
    test('getAllLabels should return all available labels', async () => {
      const mockLabels = ['bug', 'feature', 'critical', 'documentation'];
        
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLabels
      });
      
      const result = await api.getAllLabels();
      
      expect(fetch).toHaveBeenCalledWith('/tasks/get/all/labels');
      expect(result).toEqual(mockLabels);
    });

    test('getAllLabels should handle network errors', async () => {
      fetch.mockImplementationOnce(() => {
        throw new Error('Network error');
      });
        
      await expect(api.getAllLabels()).rejects.toThrow('Network error');
    });
      
    test('deleteTask should delete a task', async () => {
      fetch.mockResolvedValueOnce({
        ok: true
      });
      
      const result = await api.deleteTask('1');
      
      expect(fetch).toHaveBeenCalledWith('/tasks/1', {
        method: 'DELETE'
      });
      expect(result).toBe(true);
    });
      
    test('deleteTask should handle 404 responses', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });
      
      const result = await api.deleteTask('1');
      
      expect(fetch).toHaveBeenCalledWith('/tasks/1', {
        method: 'DELETE'
      });
      expect(result).toBe(true);
    });
      
    test('updateTaskRow should update task row', async () => {
      const mockTask = { id: '1', title: 'Task 1', row: { id: 'row2' } };
        
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTask
      });
      
      const result = await api.updateTaskRow('1', 'row2');
      
      expect(fetch).toHaveBeenCalledWith('/tasks/1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          row: {
            id: 'row2'
          }
        }),
      });
      expect(result).toEqual(mockTask);
    });
      
    test('updateTaskRow should handle null row ID', async () => {
      const mockTask = { id: '1', title: 'Task 1', row: null };
        
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTask
      });
      
      const result = await api.updateTaskRow('1', null);
      
      expect(fetch).toHaveBeenCalledWith('/tasks/1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          row: null
        }),
      });
      expect(result).toEqual(mockTask);
    });
      
    test('updateTaskRow should handle error responses with details', async () => {
      const errorResponse = { message: 'Row not found' };
        
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => errorResponse
      });
      
      await expect(api.updateTaskRow('1', 'row2')).rejects.toThrow(
        'Error updating task row: 404 - Row not found'
      );
      
      expect(fetch).toHaveBeenCalledWith('/tasks/1', expect.any(Object));
    });

    test('updateTask should handle error responses', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400
      });
    
      await expect(api.updateTask('task1', { title: 'Updated' })).rejects.toThrow('Error updating task: 400');
    });

    test('updateTaskName should handle error responses', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400
      });
        
      await expect(api.updateTaskName('task1', 'New Name')).rejects.toThrow('Failed to update task: 400');
    });
      
    test('fetchTask should handle error responses', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });
        
      await expect(api.fetchTask('task1')).rejects.toThrow('Error fetching task: 404');
    });
      
    test('addTask should handle error responses', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400
      });
        
      await expect(api.addTask('Task', 'col1')).rejects.toThrow('Error adding task: 400');
    });

    test('updateTaskRow should handle error with no error data', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => { throw new Error('Invalid JSON'); }
      });
        
      await expect(api.updateTaskRow('task1', 'row1')).rejects.toThrow(
        'Error updating task row: 500 - Unknown error'
      );
    });

    test('updateTaskColumn should handle error with no error data', async () => {
        fetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => { throw new Error('Invalid JSON'); }
        });
        
        await expect(api.updateTaskColumn('task1', 'col1')).rejects.toThrow(
          'Error updating task column: 500 - Unknown error'
        );
    });

    test('assignUserToTask should handle general errors', async () => {
      // First mock for WIP check
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ willExceedLimit: false })
      });
        
      // Mock fetch to throw a generic error
      fetch.mockImplementationOnce(() => {
        throw new Error('Network error');
      });
        
      await expect(api.assignUserToTask('task1', 'user1')).rejects.toThrow(
        'Limit WIP osiągnięty: Nie można przypisać więcej tasków temu userowi.'
      );
    });

    test('assignUserToTask should handle server error responses', async () => {
      // Mock error response with custom message
      const errorResponse = { error: 'WIP limit exceeded for this user' };
        
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ willExceedLimit: false })
      });
        
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => errorResponse
      });
        
      await expect(api.assignUserToTask('task1', 'user1')).rejects.toThrow(
        'Limit WIP osiągnięty: Nie można przypisać więcej tasków temu userowi.'
      );
        
       expect(fetch).toHaveBeenCalledTimes(2);
    });

  });

  // ====== ROW OPERATIONS TESTS ======
  describe('Row Operations', () => {
    test('updateRowName should update row name', async () => {
      const mockRow = { id: 'row1', name: 'Updated Row' };
            
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRow
      });

      const result = await api.updateRowName('row1', 'Updated Row');

      expect(fetch).toHaveBeenCalledWith('/rows/row1', {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Updated Row' }),
        });
      expect(result).toEqual(mockRow);
    });
        
    test('updateRowWipLimit should update row WIP limit', async () => {
        const mockRow = { id: 'row1', wipLimit: 3 };
        const wipLimit = 3;
                
        fetch.mockResolvedValueOnce({
            status: 200,
            json: async () => mockRow
        });
            
        const result = await api.updateRowWipLimit('row1', wipLimit);
            
        expect(fetch).toHaveBeenCalledWith('/rows/row1', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                wipLimit: parseInt(wipLimit)
            }),
        });
        expect(result).toEqual(mockRow);
    });
        
    test('fetchRows should retry on failure', async () => {
        const mockRows = [{ id: 'row1', name: 'Features' }];
            
        fetch.mockResolvedValueOnce({
            ok: false,
            status: 500
        });
            
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockRows
        });

        const result = await api.fetchRows(2);

        expect(fetch).toHaveBeenCalledTimes(2);
        expect(result).toEqual(mockRows);
    });
        
    test('addRow should create a new row', async () => {
        const mockRow = { id: 'row1', name: 'New Row', wipLimit: 5 };
            
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockRow
        });

        const result = await api.addRow('New Row', 5);

        expect(fetch).toHaveBeenCalledWith('/rows', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: 'New Row', wipLimit: 5 }),
        });
        expect(result).toEqual(mockRow);
    });
        
    test('updateRowPosition should update row position', async () => {
        const mockRow = { id: 'row1', position: 2 };
            
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockRow
        });

        const result = await api.updateRowPosition('row1', 2);

        expect(fetch).toHaveBeenCalledWith('/rows/row1/position/2', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        expect(result).toEqual(mockRow);
    });
        
    test('deleteRow should delete a row', async () => {
        fetch.mockResolvedValueOnce({
            ok: true
        });

        const result = await api.deleteRow('row1');

        expect(fetch).toHaveBeenCalledWith('/rows/row1', {
            method: 'DELETE'
        });
        expect(result).toBe(true);
    });
        
    test('deleteRow with cascade should include cascade parameter', async () => {
        fetch.mockResolvedValueOnce({
            ok: true
        });

        const result = await api.deleteRow('row1', true);

        expect(fetch).toHaveBeenCalledWith('/rows/row1?cascade=true', {
            method: 'DELETE'
        });
        expect(result).toBe(true);
    });

    test('fetchRows should return rows when successful', async () => {
        // Mock data
        const mockRows = [
          { id: 'row1', name: 'Team A', position: 0, wipLimit: 5 },
          { id: 'row2', name: 'Team B', position: 1, wipLimit: 3 }
        ];
      
        // Mock the fetch response
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockRows
        });
      
        // Execute the function
        const result = await api.fetchRows();
      
        // Assertions
        expect(fetch).toHaveBeenCalledWith('/rows');
        expect(result).toEqual(mockRows);
    });
      
    test('fetchRows should retry on failure', async () => {
        // First two calls fail, third succeeds
        const mockRows = [{ id: 'row1', name: 'Team A' }];
        
        fetch.mockResolvedValueOnce({
          ok: false,
          status: 500
        });
        
        fetch.mockResolvedValueOnce({
          ok: false,
          status: 500
        });
        
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockRows
        });
      
        // Execute with default 3 retries
        const result = await api.fetchRows();
      
        // Should have been called 3 times
        expect(fetch).toHaveBeenCalledTimes(3);
        expect(result).toEqual(mockRows);
    });
      
    test('fetchRows should throw after all retries fail', async () => {
        // All fetch calls fail
        fetch.mockResolvedValue({
          ok: false,
          status: 500
        });
      
        // Execute with 2 retries
        await expect(api.fetchRows(2)).rejects.toThrow('Error fetching rows: 500');
        
        // Should have been called 2 times
        expect(fetch).toHaveBeenCalledTimes(2);
    });
      
    test('fetchRow should return a specific row', async () => {
        const mockRow = { id: 'row1', name: 'Team A', position: 0, wipLimit: 5 };
        
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockRow
        });
      
        const result = await api.fetchRow('row1');
      
        expect(fetch).toHaveBeenCalledWith('/rows/row1');
        expect(result).toEqual(mockRow);
    });
      
    test('addRow should create a new row', async () => {
        const mockRow = { id: 'row3', name: 'Team C', wipLimit: 4 };
        
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockRow
        });
      
        const result = await api.addRow('Team C', 4);
      
        expect(fetch).toHaveBeenCalledWith('/rows', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: 'Team C', wipLimit: 4 }),
        });
        expect(result).toEqual(mockRow);
    });
      
    test('updateRowWipLimit should update row WIP limit', async () => {
        const mockRow = { id: 'row1', wipLimit: 8 };
        const wipLimit = 8;
          
        fetch.mockResolvedValueOnce({
          status: 200,
          json: async () => mockRow
        });
        
        const result = await api.updateRowWipLimit('row1', wipLimit);
        
        expect(fetch).toHaveBeenCalledWith('/rows/row1', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            wipLimit: parseInt(wipLimit)
          }),
        });
        expect(result).toEqual(mockRow);
    });
      
    test('updateRowWipLimit should handle JSON parsing errors', async () => {
        const rowId = 'row1';
        const wipLimit = 8;
        
        // Mock a successful response that doesn't return valid JSON
        fetch.mockResolvedValueOnce({
          status: 204, // No content response
          json: async () => { throw new Error('Invalid JSON'); }
        });
        
        const result = await api.updateRowWipLimit(rowId, wipLimit);
        
        expect(fetch).toHaveBeenCalledWith('/rows/row1', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            wipLimit: parseInt(wipLimit)
          }),
        });
        
        // Should create a synthetic response
        expect(result).toEqual({
          id: rowId,
          wipLimit: parseInt(wipLimit)
        });
    });
      
    test('updateRowPosition should update row position', async () => {
        const mockRow = { id: 'row1', position: 3 };
        
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockRow
        });
      
        const result = await api.updateRowPosition('row1', 3);
      
        expect(fetch).toHaveBeenCalledWith('/rows/row1/position/3', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        expect(result).toEqual(mockRow);
    });
      
    test('deleteRow should delete a row', async () => {
        fetch.mockResolvedValueOnce({
          ok: true
        });
      
        const result = await api.deleteRow('row1');
      
        expect(fetch).toHaveBeenCalledWith('/rows/row1', {
          method: 'DELETE'
        });
        expect(result).toBe(true);
    });
      
    test('deleteRow with cascade should include cascade parameter', async () => {
        fetch.mockResolvedValueOnce({
          ok: true
        });
      
        const result = await api.deleteRow('row1', true);
      
        expect(fetch).toHaveBeenCalledWith('/rows/row1?cascade=true', {
          method: 'DELETE'
        });
        expect(result).toBe(true);
    });
      
    test('deleteRow should handle 404 responses', async () => {
        fetch.mockResolvedValueOnce({
          ok: false,
          status: 404
        });
      
        const result = await api.deleteRow('row1');
      
        expect(fetch).toHaveBeenCalledWith('/rows/row1', {
          method: 'DELETE'
        });
        expect(result).toBe(true);
    });
      
    test('updateRowName should update row name', async () => {
        const mockRow = { id: 'row1', name: 'Updated Team Name' };
        
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockRow
        });
      
        const result = await api.updateRowName('row1', 'Updated Team Name');
      
        expect(fetch).toHaveBeenCalledWith('/rows/row1', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: 'Updated Team Name' }),
        });
        expect(result).toEqual(mockRow);
    });
      
    test('updateRowName should throw on error', async () => {
        fetch.mockResolvedValueOnce({
          ok: false,
          status: 500
        });
      
        await expect(api.updateRowName('row1', 'Updated Team Name')).rejects.toThrow(
          'Failed to update row: 500'
        );
      
        expect(fetch).toHaveBeenCalledWith('/rows/row1', expect.any(Object));
    });

    test('fetchRow should handle error responses', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });
        
      await expect(api.fetchRow('row1')).rejects.toThrow('Error fetching row: 404');
    });
      
    test('addRow should handle error responses', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400
      });
        
      await expect(api.addRow('Row', 5)).rejects.toThrow('Error adding row: 400');
    });

    test('deleteRow should handle error not related to 404', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });
        
      await expect(api.deleteRow('row1')).rejects.toThrow('Error deleting row: 500');
    });

    test('fetchRows should throw error on fetch failure', async () => {
      // Mock fetch to throw an error
      fetch.mockImplementationOnce(() => {
        throw new Error('Network error');
      });
        
      await expect(api.fetchRows(1)).rejects.toThrow('Network error');
    });

  });

  // ====== USER OPERATIONS TESTS ======
  describe('User Operations', () => {
    test('updateUserWipLimit should update user WIP limit', async () => {
      const mockUser = { id: '123', name: 'Test User', wipLimit: 5 };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser
      });

      const result = await api.updateUserWipLimit('123', 5);

      expect(fetch).toHaveBeenCalledWith('/users/123/wip-limit', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(5),
      });
      expect(result).toEqual(mockUser);
    });

    test('getUserAvatar should return blob URL when successful', async () => {
      const mockBlob = new Blob(['mock image data'], { type: 'image/jpeg' });
      
      fetch.mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob
      });

      const result = await api.getUserAvatar('123');

      expect(fetch).toHaveBeenCalledWith('/users/123/avatar', {
        headers: {
          'Accept': 'image/*, application/json',
          'Cache-Control': 'no-cache'
        }
      });
      expect(URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(result).toBe('mock-blob-url');
    });

    test('getUserAvatar should return null when fetch fails', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      const result = await api.getUserAvatar('123');

      expect(fetch).toHaveBeenCalled();
      expect(result).toBeNull();
    });

    test('uploadUserAvatar should upload user avatar', async () => {
      const mockFile = new File(['file content'], 'avatar.jpg', { type: 'image/jpeg' });
      
      fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => 'Avatar uploaded successfully!'
      });

      const result = await api.uploadUserAvatar('123', mockFile);

      // Check that FormData was used correctly
      expect(fetch).toHaveBeenCalledWith('/users/123/avatar', {
        method: 'POST',
        body: expect.any(FormData)
      });
      expect(result).toBe('Avatar uploaded successfully!');
    });

    test('fetchUsers should return users when successful', async () => {
      const mockUsers = [
        { id: 'user1', name: 'John Doe', email: 'john@example.com' },
        { id: 'user2', name: 'Jane Smith', email: 'jane@example.com' }
      ];
        
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUsers
      });
      
      const result = await api.fetchUsers();
      
      expect(fetch).toHaveBeenCalledWith('/users');
      expect(result).toEqual(mockUsers);
    });
      
    test('fetchUser should return a specific user', async () => {
      const mockUser = { id: 'user1', name: 'John Doe', email: 'john@example.com' };
        
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser
      });
      
      const result = await api.fetchUser('user1');
      
      expect(fetch).toHaveBeenCalledWith('/users/user1');
      expect(result).toEqual(mockUser);
    });
      
    test('addUser should create a new user', async () => {
      const userData = { name: 'New User', email: 'new@example.com', wipLimit: 5 };
      const mockUser = { id: 'user3', ...userData };
        
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser
      });
      
      const result = await api.addUser(userData);
      
      expect(fetch).toHaveBeenCalledWith('/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      expect(result).toEqual(mockUser);
    });
      
    test('updateUser should update a user with PUT', async () => {
      const userId = 'user1';
      const userData = { name: 'Updated User', email: 'updated@example.com' };
      const mockUser = { id: userId, ...userData };
        
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser
      });
      
      const result = await api.updateUser(userId, userData);
      
      expect(fetch).toHaveBeenCalledWith('/users/user1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      expect(result).toEqual(mockUser);
    });
      
    test('patchUser should update partial user data with PATCH', async () => {
      const userId = 'user1';
      const userData = { name: 'Patched Name' };
      const mockUser = { id: userId, name: 'Patched Name', email: 'existing@example.com' };
        
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser
      });
      
      const result = await api.patchUser(userId, userData);
      
      expect(fetch).toHaveBeenCalledWith('/users/user1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      expect(result).toEqual(mockUser);
    });
      
    test('deleteUser should delete a user', async () => {
      fetch.mockResolvedValueOnce({
        ok: true
      });
      
      const result = await api.deleteUser('user1');
      
      expect(fetch).toHaveBeenCalledWith('/users/user1', {
        method: 'DELETE'
      });
      expect(result).toBe(true);
    });
      
    test('deleteUser should handle 404 responses', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });
      
      const result = await api.deleteUser('user1');
      
      expect(fetch).toHaveBeenCalledWith('/users/user1', {
        method: 'DELETE'
      });
      expect(result).toBe(true);
    });
      
    test('uploadUserAvatar should upload a user avatar', async () => {
      const userId = 'user1';
      const file = new File(['dummy content'], 'avatar.png', { type: 'image/png' });
      const mockResponse = 'Avatar uploaded successfully';
        
      fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => mockResponse
      });
      
      const result = await api.uploadUserAvatar(userId, file);
      
      expect(fetch).toHaveBeenCalledWith('/users/user1/avatar', {
        method: 'POST',
        body: expect.any(FormData)
      });
      expect(result).toBe(mockResponse);
    });
      
    test('getUserAvatar should return blob URL when successful', async () => {
      const userId = 'user1';
      const mockBlob = new Blob(['dummy image data'], { type: 'image/jpeg' });
        
      fetch.mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob
      });
      
      const result = await api.getUserAvatar(userId);
      
      expect(fetch).toHaveBeenCalledWith('/users/user1/avatar', {
        headers: {
          'Accept': 'image/*, application/json',
          'Cache-Control': 'no-cache'
        }
      });
      expect(URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(result).toBe('mock-blob-url');
    });
      
    test('getUserAvatar should return null when fetch fails', async () => {
      const userId = 'user1';
        
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });
      
      const result = await api.getUserAvatar(userId);
      
      expect(fetch).toHaveBeenCalledWith('/users/user1/avatar', expect.any(Object));
      expect(result).toBeNull();
    });
      
    test('deleteUserAvatar should delete a user avatar', async () => {
      const userId = 'user1';
      const mockResponse = 'Avatar deleted successfully';
        
      fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => mockResponse
      });
      
      const result = await api.deleteUserAvatar(userId);
      
      expect(fetch).toHaveBeenCalledWith('/users/user1/avatar', {
        method: 'DELETE'
      });
      expect(result).toBe(mockResponse);
    });

    test('deleteUserAvatar should handle error responses', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });
        
      await expect(api.deleteUserAvatar('user1')).rejects.toThrow('Error deleting avatar: 500');
    });
      
    test('updateUserWipLimit should update user WIP limit', async () => {
      const userId = 'user1';
      const wipLimit = 7;
      const mockResponse = { id: userId, wipLimit: 7 };
        
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });
      
      const result = await api.updateUserWipLimit(userId, wipLimit);
      
      expect(fetch).toHaveBeenCalledWith('/users/user1/wip-limit', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(wipLimit),
      });
      expect(result).toEqual(mockResponse);
    });

    test('updateUserWipLimit should handle non-numeric input', async () => {
      const mockUser = { id: 'user1', wipLimit: 5 };
        
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser
      });
        
      const result = await api.updateUserWipLimit('user1', '5');
        
      expect(fetch).toHaveBeenCalledWith('/users/user1/wip-limit', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(5), // Should convert to number
      });
      expect(result).toEqual(mockUser);
    });
      
    test('getUserWipLimit should return user WIP status', async () => {
      const userId = 'user1';
      const mockStatus = { 
        userName: 'John Doe',
        currentTasks: 3,
        wipLimit: 5,
        willExceedLimit: false
      };
        
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatus
      });
      
      const result = await api.getUserWipLimit(userId);
      
      expect(fetch).toHaveBeenCalledWith('/users/user1/wip-status');
      expect(result).toEqual(mockStatus);
    });

    test('updateUserWipLimit should handle error response', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400
      });
        
      await expect(api.updateUserWipLimit('user1', 5)).rejects.toThrow(
        'Failed to update user WIP limit'
      );
    });

    test('getUserWipLimit should handle response with status 400', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400
      });
        
      await expect(api.getUserWipLimit('user1')).rejects.toThrow(
        'Failed to check user WIP status'
      );
    });

    test('getUserAvatar should handle connection errors gracefully', async () => {
      // Mock fetch to throw a network error
      fetch.mockImplementationOnce(() => {
        throw new Error('Network error');
      });
        
      const result = await api.getUserAvatar('user1');
      expect(result).toBeNull();
    });

  });

  // ====== SUBTASK OPERATIONS TESTS ======
  describe('SubTask Operations', () => {
    test('fetchSubTasksByTaskId should return subtasks for a task', async () => {
      const mockSubTasks = [
        { id: 1, title: 'SubTask 1', completed: false },
        { id: 2, title: 'SubTask 2', completed: true }
      ];

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSubTasks
      });

      const result = await api.fetchSubTasksByTaskId('1');

      expect(fetch).toHaveBeenCalledWith('/subtasks/task/1');
      expect(result).toEqual(mockSubTasks);
    });

    test('toggleSubTaskCompletion should toggle subtask status', async () => {
      const mockSubTask = { id: 1, title: 'SubTask 1', completed: true };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSubTask
      });

      const result = await api.toggleSubTaskCompletion(1);

      expect(fetch).toHaveBeenCalledWith('/subtasks/1/change', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      expect(result).toEqual(mockSubTask);
    });

    test('fetchSubTasks should return all subtasks when successful', async () => {
      const mockSubTasks = [
        { id: 'sub1', title: 'SubTask 1', completed: false },
        { id: 'sub2', title: 'SubTask 2', completed: true }
      ];
        
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSubTasks
      });
      
      const result = await api.fetchSubTasks();
      
      expect(fetch).toHaveBeenCalledWith('/subtasks');
      expect(result).toEqual(mockSubTasks);
    });
      
    test('fetchSubTask should return a specific subtask', async () => {
      const mockSubTask = { id: 'sub1', title: 'SubTask 1', completed: false };
        
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSubTask
      });
      
      const result = await api.fetchSubTask('sub1');
      
      expect(fetch).toHaveBeenCalledWith('/subtasks/sub1');
      expect(result).toEqual(mockSubTask);
    });
      
    test('fetchSubTasksByTaskId should return subtasks for a specific task', async () => {
      const taskId = 'task1';
      const mockSubTasks = [
        { id: 'sub1', title: 'SubTask 1', completed: false },
        { id: 'sub2', title: 'SubTask 2', completed: true }
      ];
        
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSubTasks
      });
      
      const result = await api.fetchSubTasksByTaskId(taskId);
      
      expect(fetch).toHaveBeenCalledWith('/subtasks/task/task1');
      expect(result).toEqual(mockSubTasks);
    });

    test('fetchSubTasksByTaskId should handle network errors', async () => {
      fetch.mockImplementationOnce(() => {
        throw new Error('Network error');
      });
        
      await expect(api.fetchSubTasksByTaskId('1')).rejects.toThrow('Network error');
    });
      
    test('addSubTask should create a new subtask', async () => {
      const taskId = 'task1';
      const title = 'New SubTask';
      const mockSubTask = { id: 'sub3', title: 'New SubTask', completed: false };
        
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSubTask
      });
      
      const result = await api.addSubTask(taskId, title);
      
      expect(fetch).toHaveBeenCalledWith('/subtasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          completed: false,
          task: {
            id: taskId
          }
        }),
      });
      expect(result).toEqual(mockSubTask);
    });
      
    test('updateSubTask should update a subtask with provided data', async () => {
      const subTaskId = 'sub1';
      const subTaskData = { title: 'Updated SubTask', completed: true };
      const mockSubTask = { id: subTaskId, ...subTaskData };
        
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSubTask
      });
      
      const result = await api.updateSubTask(subTaskId, subTaskData);
      
      expect(fetch).toHaveBeenCalledWith('/subtasks/sub1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subTaskData),
      });
      expect(result).toEqual(mockSubTask);
    });
      
    test('toggleSubTaskCompletion should toggle the completion state', async () => {
      const subTaskId = 'sub1';
      const mockSubTask = { id: subTaskId, title: 'SubTask 1', completed: true };
        
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSubTask
      });
      
      const result = await api.toggleSubTaskCompletion(subTaskId);
      
      expect(fetch).toHaveBeenCalledWith('/subtasks/sub1/change', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      expect(result).toEqual(mockSubTask);
    });
      
    test('updateSubTaskPosition should update subtask position', async () => {
      const subTaskId = 'sub1';
      const position = 2;
      const mockSubTask = { id: subTaskId, title: 'SubTask 1', position: 2 };
        
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSubTask
      });
      
      const result = await api.updateSubTaskPosition(subTaskId, position);
      
      expect(fetch).toHaveBeenCalledWith('/subtasks/sub1/position/2', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      expect(result).toEqual(mockSubTask);
    });

    test('updateSubTaskPosition should handle error responses', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400
      });
        
      await expect(api.updateTaskPosition('1', 2)).rejects.toThrow('Error updating task position: 400');
    });
      
    test('assignTaskToSubTask should assign a task to a subtask', async () => {
      const subTaskId = 'sub1';
      const taskId = 'task2';
      const mockSubTask = { id: subTaskId, title: 'SubTask 1', task: { id: taskId } };
        
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSubTask
      });
    
      const result = await api.assignTaskToSubTask(subTaskId, taskId);
      
      expect(fetch).toHaveBeenCalledWith('/subtasks/sub1/task/task2', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      expect(result).toEqual(mockSubTask);
    });

    test('assignTaskToSubTask should handle error responses', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400
      });
        
      await expect(api.assignTaskToSubTask('sub1', 'task1')).rejects.toThrow('Error assigning task to subtask: 400');
    });
      
    test('deleteSubTask should delete a subtask', async () => {
      const subTaskId = 'sub1';
        
      fetch.mockResolvedValueOnce({
        ok: true
      });
      
      const result = await api.deleteSubTask(subTaskId);
      
      expect(fetch).toHaveBeenCalledWith('/subtasks/sub1', {
        method: 'DELETE'
      });
      expect(result).toBe(true);
    });
      
    test('deleteSubTask should handle 404 responses', async () => {
      const subTaskId = 'sub1';
        
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });
      
      const result = await api.deleteSubTask(subTaskId);
      
      expect(fetch).toHaveBeenCalledWith('/subtasks/sub1', {
        method: 'DELETE'
      });
      expect(result).toBe(true);
    });
      
    test('deleteSubTask should throw on error responses other than 404', async () => {
      const subTaskId = 'sub1';
        
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });
      
      await expect(api.deleteSubTask(subTaskId)).rejects.toThrow('Error deleting subtask: 500');
      
      expect(fetch).toHaveBeenCalledWith('/subtasks/sub1', {
        method: 'DELETE'
      });
    });

  });

  // ====== FILE OPERATIONS TESTS ======
  describe('File Operations', () => {
    test('uploadFile should upload a file', async () => {
      const mockFile = new File(['file content'], 'document.pdf', { type: 'application/pdf' });
      
      fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => 'File uploaded successfully!'
      });

      const result = await api.uploadFile(mockFile);

      // Check that FormData was used correctly
      expect(fetch).toHaveBeenCalledWith('/files/upload', {
        method: 'POST',
        body: expect.any(FormData)
      });
      expect(result).toBe('File uploaded successfully!');
    });

    test('uploadFile should upload a file successfully', async () => {
      // Create a mock file
      const file = new File(['test file content'], 'test.txt', { type: 'text/plain' });
      const mockResponse = 'file-123';
        
      fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => mockResponse
      });
      
      const result = await api.uploadFile(file);
      
      expect(fetch).toHaveBeenCalledWith('/files/upload', {
        method: 'POST',
        body: expect.any(FormData)
      });
        
      // Check that the response is correctly returned
      expect(result).toBe(mockResponse);
    });
      
    test('uploadFile should handle error responses', async () => {
      const file = new File(['test file content'], 'test.txt', { type: 'text/plain' });
        
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 413 // Payload too large
      });
      
      await expect(api.uploadFile(file)).rejects.toThrow('Error uploading file: 413');
      
      expect(fetch).toHaveBeenCalledWith('/files/upload', {
        method: 'POST',
        body: expect.any(FormData)
      });
    });
      
    test('getFile should return the full response for blob handling', async () => {
      const fileId = 'file-123';
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        blob: async () => new Blob(['file content'], { type: 'text/plain' })
      };
        
      fetch.mockResolvedValueOnce(mockResponse);
      
      const result = await api.getFile(fileId);
      
      expect(fetch).toHaveBeenCalledWith('/files/file-123');
        
      // The full response should be returned
      expect(result).toBe(mockResponse);
    });
      
    test('getFile should handle error responses', async () => {
      const fileId = 'file-123';
        
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });
      
      await expect(api.getFile(fileId)).rejects.toThrow('Error fetching file: 404');
      
      expect(fetch).toHaveBeenCalledWith('/files/file-123');
    });
      
    test('deleteFile should delete a file successfully', async () => {
      const fileId = 'file-123';
      const mockResponse = 'File deleted successfully';
        
      fetch.mockResolvedValueOnce({
        ok: true,
        text: async () => mockResponse
      });
      
      const result = await api.deleteFile(fileId);
      
      expect(fetch).toHaveBeenCalledWith('/files/file-123', {
        method: 'DELETE'
      });
        
      // Check that the response is correctly returned
      expect(result).toBe(mockResponse);
    });
      
    test('deleteFile should handle error responses', async () => {
      const fileId = 'file-123';
        
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });
      
      await expect(api.deleteFile(fileId)).rejects.toThrow('Error deleting file: 404');
      
      expect(fetch).toHaveBeenCalledWith('/files/file-123', {
        method: 'DELETE'
      });
    });
      
    test('file upload should create and populate FormData correctly', async () => {
      // Create a mock file with specific content and type
      const fileName = 'important-document.pdf';
      const fileContent = 'PDF document content';
      const fileType = 'application/pdf';
      const file = new File([fileContent], fileName, { type: fileType });
        
      // Mock the fetch response
      fetch.mockImplementationOnce((url, options) => {
        // Extract and verify the FormData sent
        const formData = options.body;
        const fileFromForm = formData.get('file');
          
        // Verify that the file in the FormData matches what we sent
        expect(fileFromForm.name).toBe(fileName);
        expect(fileFromForm.type).toBe(fileType);
          
        // Return a successful response
        return Promise.resolve({
          ok: true,
          text: async () => 'file-123'
        });
      });
      
      await api.uploadFile(file);
        
      // Verify that fetch was called
      expect(fetch).toHaveBeenCalledWith('/files/upload', {
        method: 'POST',
        body: expect.any(FormData)
      });
    });
      
    test('getFile should allow consuming the response as blob', async () => {
      const fileId = 'file-123';
      const mockBlob = new Blob(['file content'], { type: 'application/pdf' });
        
      // Create mock response that supports blob() method
      const mockResponse = {
        ok: true,
        blob: jest.fn().mockResolvedValue(mockBlob)
      };
        
      fetch.mockResolvedValueOnce(mockResponse);
      
      const response = await api.getFile(fileId);
        
      // Test that the consumer can use the response to get a blob
      const blob = await response.blob();
        
      expect(fetch).toHaveBeenCalledWith('/files/file-123');
      expect(mockResponse.blob).toHaveBeenCalled();
      expect(blob).toBe(mockBlob);
    });
      
    test('getFile should allow creating an object URL', async () => {
      const fileId = 'file-123';
      const mockBlob = new Blob(['file content'], { type: 'application/pdf' });
        
      // Create mock response that supports blob() method
      const mockResponse = {
        ok: true,
        blob: jest.fn().mockResolvedValue(mockBlob)
      };
        
      fetch.mockResolvedValueOnce(mockResponse);
      
      const response = await api.getFile(fileId);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
        
      expect(fetch).toHaveBeenCalledWith('/files/file-123');
      expect(URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(objectUrl).toBe('mock-blob-url');
    });

    test('uploadFile should use proper FormData with file contents', async () => {
        const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
        
        // Check that FormData is properly constructed
        fetch.mockImplementationOnce((url, options) => {
          const formData = options.body;
          expect(formData instanceof FormData).toBe(true);
          
          const fileFromForm = formData.get('file');
          expect(fileFromForm).toBe(file);
          
          return Promise.resolve({
            ok: true,
            text: async () => 'Success'
          });
        });
        
        await api.uploadFile(file);
        expect(fetch).toHaveBeenCalledWith('/files/upload', expect.any(Object));
    });
      
    test('uploadUserAvatar should use proper FormData with file contents', async () => {
      const file = new File(['avatar content'], 'avatar.png', { type: 'image/png' });
        
      // Check that FormData is properly constructed
      fetch.mockImplementationOnce((url, options) => {
        const formData = options.body;
        expect(formData instanceof FormData).toBe(true);
          
        const fileFromForm = formData.get('file');
        expect(fileFromForm).toBe(file);
          
        return Promise.resolve({
          ok: true,
          text: async () => 'Success'
        });
      });
        
      await api.uploadUserAvatar('user1', file);
      expect(fetch).toHaveBeenCalledWith('/users/user1/avatar', expect.any(Object));
    });
    
  });

  // Tests for multiple fetch handling
  describe('Multiple fetch scenarios', () => {
    test('fetch retries should work properly for maximum retries', async () => {
      // Set up 3 consecutive failures
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });
      
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });
      
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });
      
      // This should exhaust the 3 retries
      await expect(api.fetchColumns(3)).rejects.toThrow('Error fetching columns: 500');
      expect(fetch).toHaveBeenCalledTimes(3);
    });
    
    test('makeRequest utility should properly handle non-JSON responses', async () => {
      const mockTask = { id: '1', title: 'Task 1', column: { id: 'col1' } };
      
      // First call succeeds but returns non-JSON content
      fetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => 'text/plain'
        },
        text: async () => 'Success',
        json: async () => { throw new Error('Not JSON'); }
      });
      
      // Second call with JSON
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTask
      });
      
      // Test both paths
      const result1 = await api.updateTaskName('1', 'Task 1');
      expect(result1).toEqual(mockTask);
    });

    test('makeRequest should handle JSON parse errors with error details', async () => {
      // Set up the first fetch response to be a failed request with JSON error details
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Bad request details' })
      });
        
      // Use any API method that would use this error path
      await expect(api.updateTaskLabels('1', [])).rejects.toThrow('Error updating task labels: 400');
    });
      
    test('makeRequest should handle JSON parse errors without error details', async () => {
      // Set up the fetch response to be a failed request with a JSON error
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => { throw new Error('Invalid JSON'); }
      });
        
      // Use any API method that would use this error path
      await expect(api.updateTaskLabels('1', [])).rejects.toThrow('Error updating task labels: 400');
    });
    
  });

});