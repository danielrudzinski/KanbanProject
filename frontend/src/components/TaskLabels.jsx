import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { addLabelToTask, removeLabelFromTask, updateTaskLabels } from '../services/api';
import '../styles/components/TaskLabels.css';

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
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customLabelName, setCustomLabelName] = useState('');
  const [customLabelColor, setCustomLabelColor] = useState('#888888');
  const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });
  const [formPosition, setFormPosition] = useState({ top: 0, left: 0 });
  const [isPickerReady, setIsPickerReady] = useState(false);
  const [isFormReady, setIsFormReady] = useState(false);
  
  const buttonRef = useRef(null);

  // Toggle label picker with position calculation
  const toggleLabelPicker = () => {
    if (!showLabelPicker) {
      // Calculate position first and then show after a small delay
      setIsPickerReady(false);
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setPickerPosition({
          top: rect.bottom + window.scrollY + 5,
          left: rect.left + window.scrollX
        });
        
        // Show picker after a small delay to ensure position is set
        setTimeout(() => {
          setIsPickerReady(true);
        }, 50);
      }
    }
    setShowLabelPicker(!showLabelPicker);
  };

  // Show custom form with position calculation
  const showCustomLabelForm = () => {
    setIsFormReady(false);
    setShowLabelPicker(false);
    
    // Calculate position
    const viewportWidth = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const viewportHeight = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    
    setFormPosition({
      top: viewportHeight / 2 - 150,
      left: viewportWidth / 2 - 150
    });
    
    // Show form after a small delay
    setTimeout(() => {
      setShowCustomForm(true);
      setIsFormReady(true);
    }, 50);
  };

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
  
  const handleAddCustomLabel = async () => {
    if (!customLabelName.trim()) return;
    
    try {
      await handleAddLabel(customLabelName);
      setCustomLabelName('');
      setShowCustomForm(false);
    } catch (error) {
      console.error('Error adding custom label:', error);
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

  // Helper to get color for a label (either predefined or custom)
  const getLabelColor = (labelName) => {
    const predefined = PREDEFINED_LABELS.find(l => l.name === labelName);
    return predefined?.color || '#888888';
  };

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showLabelPicker && !event.target.closest('.label-picker') && 
          event.target !== buttonRef.current) {
        setShowLabelPicker(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLabelPicker]);

  // Close custom form when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCustomForm && !event.target.closest('.custom-label-form-portal')) {
        setShowCustomForm(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCustomForm]);

  // Handle picker click to prevent closing task details
  const handlePickerClick = (e) => {
    e.stopPropagation();
  };

  // Handle form click to prevent closing task details
  const handleFormClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div className="task-labels">
      <div className="labels-container">
        {labels.map((label) => (
          <span
            key={label}
            className="label"
            style={{ backgroundColor: getLabelColor(label) }}
          >
            {label}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveLabel(label);
              }}
              className="remove-label-button"
            >
              ×
            </button>
          </span>
        ))}
        <button
          ref={buttonRef}
          className="add-label-button"
          onClick={(e) => {
            e.stopPropagation();
            toggleLabelPicker();
          }}
        >
          + Etykieta
        </button>
      </div>

      {showLabelPicker && isPickerReady && createPortal(
        <div 
          className="label-picker animated fadeIn"
          style={{
            position: 'absolute',
            top: `${pickerPosition.top}px`,
            left: `${pickerPosition.left}px`,
            zIndex: 2000
          }}
          onClick={handlePickerClick}
        >
          <div className="label-picker-header">
            Wybierz etykietę
          </div>
          {PREDEFINED_LABELS.map((label) => (
            <div
              key={label.name}
              className="label-option"
              onClick={() => {
                handleAddLabel(label.name);
                setShowLabelPicker(false);
              }}
            >
              <span 
                className="color-dot"
                style={{ backgroundColor: label.color }}
              ></span>
              {label.name}
            </div>
          ))}
          <div 
            className="custom-label-option"
            onClick={showCustomLabelForm}
          >
            <span className="color-dot custom"></span>
            Dodaj własną etykietę
          </div>
        </div>,
        document.body
      )}

      {showCustomForm && isFormReady && createPortal(
        <div 
          className="custom-label-form-portal animated fadeIn"
          style={{
            position: 'fixed',
            top: `${formPosition.top}px`,
            left: `${formPosition.left}px`,
            zIndex: 3000,
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            minWidth: '300px'
          }}
          onClick={handleFormClick}
        >
          <h3 className="form-title">Dodaj własną etykietę</h3>
          <div className="form-group">
            <label>Nazwa etykiety:</label>
            <input 
              type="text"
              value={customLabelName}
              onChange={(e) => setCustomLabelName(e.target.value)}
              placeholder="Wpisz nazwę etykiety"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Kolor etykiety:</label>
            <input 
              type="color"
              value={customLabelColor}
              onChange={(e) => setCustomLabelColor(e.target.value)}
            />
          </div>
          <div className="form-actions">
            <button
              onClick={handleAddCustomLabel}
              disabled={!customLabelName.trim()}
              className={`add-button ${!customLabelName.trim() ? 'disabled' : ''}`}
            >
              Dodaj
            </button>
            <button
              onClick={() => setShowCustomForm(false)}
              className="cancel-button"
            >
              Anuluj
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default TaskLabels;