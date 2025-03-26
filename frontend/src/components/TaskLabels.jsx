import React, { useState } from 'react';
import { addLabelToTask, removeLabelFromTask, updateTaskLabels } from '../services/api';

const PREDEFINED_LABELS = [
  { name: 'High Priority', color: '#FF4D4D' },
  { name: 'Medium Priority', color: '#FFA500' },
  { name: 'Low Priority', color: '#4CAF50' },
  { name: 'Bug', color: '#FF0000' },
  { name: 'Feature', color: '#2196F3' },
  { name: 'Documentation', color: '#9C27B0' }
];

const TaskLabels = ({ taskId, initialLabels = [], onLabelsChange }) => {
  const [labels, setLabels] = useState(initialLabels);
  const [showLabelPicker, setShowLabelPicker] = useState(false);

  const handleAddLabel = async (labelName) => {
    try {
      const labelExists = labels.some(existingLabel => 
        existingLabel.toLowerCase() === labelName.toLowerCase()
      );
  
      if (labelExists) {
        alert('Ta etykieta została już dodana do zadania');
        return;
      }
  
      await addLabelToTask(taskId, labelName);
      const updatedLabels = [...labels, labelName];
      setLabels(updatedLabels);
      onLabelsChange(updatedLabels);
    } catch (error) {
      console.error('Error adding label:', error);
      alert('Wystąpił błąd podczas dodawania etykiety');
    }
  };
  
  const handleRemoveLabel = async (labelName) => {
    try {
      await removeLabelFromTask(taskId, labelName);
      const updatedLabels = labels.filter(label => label !== labelName);
      setLabels(updatedLabels);
      onLabelsChange(updatedLabels);
    } catch (error) {
      console.error('Error removing label:', error);
      alert('Wystąpił błąd podczas usuwania etykiety');
    }
  };

  return (
    <div className="task-labels">
      <div className="labels-container">
        {labels.map((label) => (
          <span
            key={label}
            className="label"
            style={{ 
              backgroundColor: PREDEFINED_LABELS.find(l => l.name === label)?.color || '#888',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              margin: '0 4px',
              color: 'white',
              display: 'inline-flex',
              alignItems: 'center'
            }}
          >
            {label}
            <button
              onClick={() => handleRemoveLabel(label)}
              style={{
                marginLeft: '4px',
                border: 'none',
                background: 'none',
                color: 'white',
                cursor: 'pointer',
                padding: '0 4px'
              }}
            >
              ×
            </button>
          </span>
        ))}
        <button
          className="add-label-button"
          onClick={() => setShowLabelPicker(!showLabelPicker)}
          style={{
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            padding: '2px 8px',
            fontSize: '12px'
          }}
        >
          +
        </button>
      </div>

      {showLabelPicker && (
        <div className="label-picker" style={{
          position: 'absolute',
          backgroundColor: 'white',
          border: '1px solid #ddd',
          borderRadius: '4px',
          padding: '8px',
          zIndex: 1000,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          {PREDEFINED_LABELS.map((label) => (
            <div
              key={label.name}
              onClick={() => {
                handleAddLabel(label.name);
                setShowLabelPicker(false);
              }}
              style={{
                padding: '4px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: label.color
              }}></span>
              {label.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskLabels;