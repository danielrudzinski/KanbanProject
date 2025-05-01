import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { addLabelToTask, removeLabelFromTask, getAllLabels } from '../services/api';
import '../styles/components/TaskLabels.css';
import { useKanban } from '../context/KanbanContext';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

// Keep the PREDEFINED_LABELS array for default options
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
  const [existingLabels, setExistingLabels] = useState([]);
  const [labelColors, setLabelColors] = useState({});
  const { refreshTasks } = useKanban();
  const buttonRef = useRef(null);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchExistingLabels = async () => {
      try {
        const labelsData = await getAllLabels();
        setExistingLabels(labelsData);
        const storedLabelColors = localStorage.getItem('labelColors');
        const initialLabelColors = storedLabelColors ? JSON.parse(storedLabelColors) : {};
        
        const mergedColors = { ...initialLabelColors };
        PREDEFINED_LABELS.forEach(label => {
          mergedColors[label.name] = label.color;
        });
        
        setLabelColors(mergedColors);
      } catch (error) {
        console.error('Error fetching existing labels:', error);
      }
    };
    
    fetchExistingLabels();
  }, []);

  useEffect(() => {
    if (Object.keys(labelColors).length > 0) {
      localStorage.setItem('labelColors', JSON.stringify(labelColors));
    }
  }, [labelColors]);

  const toggleLabelPicker = () => {
    if (!showLabelPicker) {
      setIsPickerReady(false);
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
        
        let leftPos = rect.left + window.scrollX;
        if (leftPos + 250 > viewportWidth) { 
          leftPos = viewportWidth - 260;
        }
        
        setPickerPosition({
          top: rect.bottom + window.scrollY + 5,
          left: leftPos
        });
        
        setTimeout(() => {
          setIsPickerReady(true);
        }, 50);
      }
    }
    setShowLabelPicker(!showLabelPicker);
  };

  const showCustomLabelForm = () => {
    setIsFormReady(false);
    setShowLabelPicker(false);
    
    const viewportWidth = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const viewportHeight = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    
    let leftPos = viewportWidth / 2 - 150; 
    if (leftPos + 300 > viewportWidth) {
      leftPos = viewportWidth - 310;
    }
    
    setFormPosition({
      top: Math.max(50, viewportHeight / 2 - 150),
      left: Math.max(10, leftPos)
    });
  
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
        toast.warning(t('taskLabels.alreadyAddedWarning'));
        return;
      }
  
      await addLabelToTask(taskId, labelName);
      const updatedLabels = [...labels, labelName];
      setLabels(updatedLabels);
      
      if (!existingLabels.includes(labelName)) {
        setExistingLabels([...existingLabels, labelName]);
      }
      
      onLabelsChange(updatedLabels);
      refreshTasks();
    } catch (error) {
      console.error('Error adding label:', error);
      toast.error(t('taskLabels.addErrorMessage'));
    }
  };
  
  const handleAddCustomLabel = async () => {
    if (!customLabelName.trim()) return;
    
    try {
      const newLabelColors = { ...labelColors };
      newLabelColors[customLabelName] = customLabelColor;
      setLabelColors(newLabelColors);
      
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
      toast.error(t('taskLabels.removeErrorMessage'));
    }
  };

  const getLabelColor = (labelName) => {
    if (labelColors[labelName]) {
      return labelColors[labelName];
    }
    
    const predefined = PREDEFINED_LABELS.find(l => l.name === labelName);
    return predefined?.color || '#888888';
  };

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

  const handlePickerClick = (e) => {
    e.stopPropagation();
  };

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
            title={label}
            data-tooltip={label}
          >
            <span 
              className="label-color-dot"
              style={{ backgroundColor: getLabelColor(label) }}
            ></span>
            <span className="label-text">{label}</span>
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
          {t('taskLabels.addLabel')}
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
            {t('taskLabels.chooseLabelHeader')}
          </div>
          
          <div className="label-section">
            <div className="section-title">{t('taskLabels.predefinedLabels')}</div>
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
          </div>
          
          {existingLabels.length > 0 && (
            <div className="label-section">
              <div className="section-title">{t('taskLabels.existingLabels')}</div>
              {existingLabels
                .filter(label => !PREDEFINED_LABELS.some(p => p.name === label))
                .map((label) => (
                  <div
                    key={label}
                    className="label-option"
                    onClick={() => {
                      handleAddLabel(label);
                      setShowLabelPicker(false);
                    }}
                  >
                    <span 
                      className="color-dot"
                      style={{ backgroundColor: getLabelColor(label) }}
                    ></span>
                    {label}
                  </div>
                ))}
            </div>
          )}
          
          <div 
            className="custom-label-option"
            onClick={showCustomLabelForm}
          >
            <span className="color-dot custom"></span>
            {t('taskLabels.addCustomLabel')}
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
          <h3 className="form-title">{t('taskLabels.addCustomLabelTitle')}</h3>
          <div className="form-group">
            <label>{t('taskLabels.labelName')}</label>
            <input 
              type="text"
              value={customLabelName}
              onChange={(e) => setCustomLabelName(e.target.value)}
              placeholder={t('taskLabels.labelNamePlaceholder')}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>{t('taskLabels.labelColor')}</label>
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
              {t('taskLabels.add')}
            </button>
            <button
              onClick={() => setShowCustomForm(false)}
              className="cancel-button"
            >
              {t('taskLabels.cancel')}
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default TaskLabels;