import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

export default class ChatApi {
  constructor(onMessageReceived, onError) {
    this.stompClient = null;
    this.onMessageReceived = onMessageReceived;
    this.onError = onError;
    this.roomSubscription = null;
    this.serverUrl = 'http://localhost:8080'; // Backend server URL
  }

  connect(username) {
    return new Promise((resolve, reject) => {
      try {
        // Create a STOMP client using the modern approach
        this.stompClient = new Client({
          // Use proper factory function format for SockJS
          webSocketFactory: () => new SockJS(`${this.serverUrl}/ws`),
          debug: () => {},
          reconnectDelay: 5000,
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000,
          onConnect: () => {
            console.log('STOMP connection established');
            this.stompClient.subscribe('/topic/public', this.onMessageReceived);
            this.stompClient.subscribe(`/user/${username}/queue/messages`, this.onMessageReceived);
            
            this.stompClient.publish({
              destination: "/app/chat.addUser",
              body: JSON.stringify({
                sender: username,
                type: 'JOIN'
              })
            });
            
            resolve();
          },
          onStompError: (frame) => {
            console.error('STOMP protocol error:', frame);
            this.onError(new Error('STOMP protocol error'));
            reject(frame);
          },
          onWebSocketError: (error) => {
            console.error('WebSocket error:', error);
            this.onError(error);
            reject(error);
          }
        });
        
        // Activate the STOMP client
        this.stompClient.activate();
      } catch (error) {
        console.error('Error setting up STOMP client:', error);
        this.onError(error);
        reject(error);
      }
    });
  }

  disconnect(currentRoom) {
    if (currentRoom) {
      this.leaveRoom(currentRoom);
    }
    
    if (this.stompClient && this.stompClient.active) {
      this.stompClient.deactivate();
      return true;
    }
    return false;
  }

  joinRoom(username, roomId) {
    if (!this.stompClient || !this.stompClient.active) return false;
    
    this.roomSubscription = this.stompClient.subscribe(`/topic/room.${roomId}`, this.onMessageReceived);
    
    this.stompClient.publish({
      destination: "/app/chat.addUser",
      body: JSON.stringify({
        sender: username,
        roomId: roomId,
        type: 'JOIN'
      })
    });
    
    return true;
  }

  leaveRoom(roomId) {
    if (!this.stompClient || !this.stompClient.active) return false;
    
    if (this.roomSubscription) {
      this.roomSubscription.unsubscribe();
      this.roomSubscription = null;
    }
    
    this.stompClient.publish({
      destination: `/app/chat.leaveRoom/${roomId}`,
      body: JSON.stringify({})
    });
    return true;
  }

  sendMessage(username, messageType, message, currentRoom, recipient) {
    if (!this.stompClient || !this.stompClient.active || !message.trim()) return false;
  
    if (messageType === 'private') {
      if (!recipient.trim()) return false;
    
      this.stompClient.publish({
        destination: "/app/chat.sendPrivateMessage",
        body: JSON.stringify({
          sender: username,
          content: message,
          recipientId: recipient,
          type: 'PRIVATE'
        })
      });
    } else if (messageType === 'room') {
      if (!currentRoom) return false;
      
      this.stompClient.publish({
        destination: "/app/chat.sendMessage",
        body: JSON.stringify({
          sender: username,
          content: message,
          roomId: currentRoom,
          type: 'CHAT'
        })
      });
    } else {
      this.stompClient.publish({
        destination: "/app/chat.sendMessage",
        body: JSON.stringify({
          sender: username,
          content: message,
          type: 'CHAT'
        })
      });
    }
    
    return true;
  }

  isConnected() {
    return this.stompClient && this.stompClient.active;
  }
}