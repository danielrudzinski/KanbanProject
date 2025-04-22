import React, { useState, useRef, useEffect } from 'react';

function EditableText({ 
  id, 
  text, 
  onUpdate, 
  className = "", 
  inputClassName = "", 
  type = "default" // 'column', 'row', 'task', or 'default'
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(text);
  const inputRef = useRef(null);
  const spanRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setValue(text);
  }, [text]);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = async () => {
    if (value.trim() !== text && value.trim() !== '') {
      const success = await onUpdate(id, value.trim(), type);
      if (!success) {
        setValue(text); 
      }
    } else if (value.trim() === '') {
      setValue(text); 
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      inputRef.current.blur();
    } else if (e.key === 'Escape') {
      setValue(text);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`editable-text-input ${inputClassName}`}
        data-type={type}
      />
    );
  }

  return (
    <span 
      ref={spanRef} 
      onDoubleClick={handleDoubleClick} 
      className={`editable-text ${className}`}
      title={text}
      data-type={type}
    >
      {text}
    </span>
  );
}

export default EditableText;