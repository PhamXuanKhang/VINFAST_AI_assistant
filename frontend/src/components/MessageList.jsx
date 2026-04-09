import { useRef, useEffect } from 'react';
import AiBubble from './AiBubble';
import UserBubble from './UserBubble';
import TypingIndicator from './TypingIndicator';
import './MessageList.css';

export default function MessageList({ messages, isLoading }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="message-list">
      {messages.map((msg) =>
        msg.role === 'user' ? (
          <UserBubble key={msg.id} message={msg} />
        ) : (
          <AiBubble key={msg.id} message={msg} />
        )
      )}
      {isLoading && <TypingIndicator />}
      <div ref={endRef} />
    </div>
  );
}
