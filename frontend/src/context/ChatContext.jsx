import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import ChatApi from '../services/chatApi';

const ChatContext = createContext();

const initialState = {
  isOpen: false,
  messages: [],
  message: '',
  isConnected: false,
  unreadCount: 0,
  currentRoom: null,
  recipient: '',
  messageType: 'public',
  availableRooms: ['general', 'help', 'random'],
};

function chatReducer(state, action) {
  switch (action.type) {
    case 'TOGGLE_CHAT':
      return { ...state, isOpen: !state.isOpen };
    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload };
    case 'SET_MESSAGE':
      return { ...state, message: action.payload };
    case 'ADD_MESSAGE':
      return { 
        ...state, 
        messages: [...state.messages, {...action.payload, read: state.isOpen}],
        unreadCount: state.isOpen ? state.unreadCount : state.unreadCount + 1 
      };
    case 'MARK_MESSAGES_READ':
      return { 
        ...state, 
        messages: state.messages.map(msg => ({ ...msg, read: true })),
        unreadCount: 0 
      };
    case 'SET_CURRENT_ROOM':
      return { ...state, currentRoom: action.payload };
    case 'SET_MESSAGE_TYPE':
      return { ...state, messageType: action.payload };
    case 'SET_RECIPIENT':
      return { ...state, recipient: action.payload };
    case 'RESET_MESSAGE':
      return { ...state, message: '' };
    default:
      return state;
  }
}

export function ChatProvider({ children }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { user } = useAuth();
  const { t } = useTranslation();
  const chatApiRef = useRef(null);

  useEffect(() => {
    if (state.isOpen) {
      dispatch({ type: 'MARK_MESSAGES_READ' });
    }
  }, [state.isOpen]);

  useEffect(() => {
    if (user && state.isOpen && !state.isConnected) {
      connect();
    }

    return () => {
      if (chatApiRef.current) {
        disconnect();
      }
    };
  }, [user, state.isOpen]);

  const onMessageReceived = (payload) => {
    console.log("Raw payload received:", payload);
    try {
      const receivedMessage = JSON.parse(payload.body);
      console.log("Message received and parsed:", receivedMessage);
      console.log("Message type:", receivedMessage.type);
      dispatch({ 
        type: 'ADD_MESSAGE', 
        payload: {
          ...receivedMessage,
          id: Date.now(),
          timestamp: receivedMessage.timestamp || new Date(),
        }
      });
    } catch (error) {
      console.error("Error processing message:", error);
    }
  };

  const onError = (error) => {
    console.error('WebSocket error:', error);
    dispatch({ type: 'SET_CONNECTED', payload: false });
    toast.error(t('chat.connectionError'));
  };

  const connect = async () => {
    if (!user) return;
    
    try {
      chatApiRef.current = new ChatApi(onMessageReceived, onError);
      await chatApiRef.current.connect(user.username);
      dispatch({ type: 'SET_CONNECTED', payload: true });
      toast.info(t('chat.connected'));
    } catch (error) {
      onError(error);
    }
  };

  const disconnect = () => {
    if (!chatApiRef.current) return;
    
    const wasDisconnected = chatApiRef.current.disconnect(state.currentRoom);
    if (wasDisconnected) {
      dispatch({ type: 'SET_CONNECTED', payload: false });
      toast.info(t('chat.disconnected'));
    }
  };

  const joinRoom = (roomId) => {
    if (!chatApiRef.current || !state.isConnected) return;
    
    // Leave current room if any
    if (state.currentRoom) {
      leaveRoom();
    }
    
    const joined = chatApiRef.current.joinRoom(user.username, roomId);
    if (joined) {
      dispatch({ type: 'SET_CURRENT_ROOM', payload: roomId });
      dispatch({ type: 'SET_MESSAGE_TYPE', payload: 'room' });
      toast.info(t('chat.joinedRoom', { room: roomId }));
    }
  };

  const leaveRoom = () => {
    if (!chatApiRef.current || !state.isConnected || !state.currentRoom) return;
    
    const left = chatApiRef.current.leaveRoom(state.currentRoom);
    if (left) {
      dispatch({ type: 'SET_CURRENT_ROOM', payload: null });
      dispatch({ type: 'SET_MESSAGE_TYPE', payload: 'public' });
      toast.info(t('chat.leftRoom'));
    }
  };

  const sendMessage = () => {
    if (!chatApiRef.current || !state.isConnected || !state.message.trim()) return;
    
    if (state.messageType === 'private' && !state.recipient.trim()) {
      toast.warning(t('chat.noRecipient'));
      return;
    }
    
    if (state.messageType === 'room' && !state.currentRoom) {
      toast.warning(t('chat.noRoom'));
      return;
    }
    
    const sent = chatApiRef.current.sendMessage(
      user.username, 
      state.messageType,
      state.message,
      state.currentRoom,
      state.recipient
    );
    
    if (sent) {
      dispatch({ type: 'RESET_MESSAGE' });
    }
  };

  const toggleChat = () => {
    dispatch({ type: 'TOGGLE_CHAT' });
  };

  const value = {
    ...state,
    toggleChat,
    sendMessage,
    joinRoom,
    leaveRoom,
    connect,
    disconnect,
    setMessage: (message) => dispatch({ type: 'SET_MESSAGE', payload: message }),
    setMessageType: (type) => dispatch({ type: 'SET_MESSAGE_TYPE', payload: type }),
    setRecipient: (recipient) => dispatch({ type: 'SET_RECIPIENT', payload: recipient }),
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};