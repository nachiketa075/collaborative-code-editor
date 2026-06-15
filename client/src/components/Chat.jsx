import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import ACTIONS from '../Actions';

const Chat = ({ socket, roomId, username }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!socket) {
      console.log('Chat: No socket available yet');
      return;
    }

    console.log('Chat: Socket available. ID:', socket.id, 'Connected:', socket.connected);

    const handleReceiveMessage = (data) => {
      console.log('Chat: Received message event:', data);
      if (data && data.message) {
        setMessages((prev) => [...prev, data]);
        if (data.username !== username) {
          toast(`New message from ${data.username}`, { icon: '💬' });
        }
      } else {
        console.warn('Chat: Received empty or invalid message data', data);
      }
    };

    const handleJoined = ({ username: joinedUser }) => {
      if (joinedUser === username) return;
      setMessages((prev) => [
        ...prev,
        {
          system: true,
          message: `${joinedUser} joined the room`,
        },
      ]);
    };

    const handleDisconnected = ({ username: leftUser }) => {
      setMessages((prev) => [
        ...prev,
        {
          system: true,
          message: `${leftUser} left the room`,
        },
      ]);
    };

    socket.on(ACTIONS.RECEIVE_MESSAGE, handleReceiveMessage);
    socket.on(ACTIONS.JOINED, handleJoined);
    socket.on(ACTIONS.DISCONNECTED, handleDisconnected);

    return () => {
      console.log('Chat: Removing listeners');
      socket.off(ACTIONS.RECEIVE_MESSAGE, handleReceiveMessage);
      socket.off(ACTIONS.JOINED, handleJoined);
      socket.off(ACTIONS.DISCONNECTED, handleDisconnected);
    };
  }, [socket, username, roomId]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      console.log('Chat: Sending message:', message, 'Room:', roomId.trim(), 'SocketID:', socket.id);
      if (!socket) {
        console.error('Chat: Cannot send message, socket not connected');
        return;
      }
      socket.emit(ACTIONS.SEND_MESSAGE, {
        roomId: roomId.trim(),
        message: message.trim(),
        username,
      });
      console.log('Chat: Message emitted');
      setMessage('');
    }
  };

  return (
    <div className="chatWrapper">
      <div className="chatHeader">
        <h3>Room Chat</h3>
      </div>
      <div className="messageList">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message ${msg.system ? 'system' : ''} ${
              msg.username === username ? 'ownMessage' : ''
            }`}
          >
            {!msg.system && (
              <div className="messageMeta">
                <span className="sender">{msg.username}</span>
                <span className="timestamp">{msg.timestamp}</span>
              </div>
            )}
            <div className="messageContent">{msg.message}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form className="chatInput" onSubmit={sendMessage}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit" className="btn sendBtn">
          Send
        </button>
      </form>
    </div>
  );
};

export default Chat;
