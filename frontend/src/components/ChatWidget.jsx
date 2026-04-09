import { useRef, useEffect } from 'react';
import { useChat } from '../hooks/useChat';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import QuickReplyBar from './QuickReplyBar';
import './ChatWidget.css';

const GREETING_REPLIES = [
  'Tôi muốn tìm hiểu về xe VinFast',
  'Tính trả góp xe điện',
  'So sánh các dòng xe',
];

export default function ChatWidget() {
  const { messages, isLoading, send, reset, threadId } = useChat();
  const isFirstMessage = messages.length === 0;

  const handleQuickReply = (text) => {
    send(text);
  };

  return (
    <div className="chat-widget">
      <ChatHeader onReset={reset} />

      <div className="chat-body">
        {isFirstMessage && (
          <div className="welcome-section">
            <div className="welcome-avatar">
              <span className="avatar-icon">🚗</span>
            </div>
            <h2 className="welcome-title">Xin chào!</h2>
            <p className="welcome-subtitle">
              Em là <strong>Vivi AI</strong>, trợ lý tư vấn xe điện VinFast.
              <br />Em có thể giúp anh/chị tìm xe phù hợp và tính chi phí.
            </p>
          </div>
        )}

        <MessageList messages={messages} isLoading={isLoading} />

        {isFirstMessage && (
          <QuickReplyBar replies={GREETING_REPLIES} onSelect={handleQuickReply} />
        )}
      </div>

      <ChatInput onSend={send} disabled={isLoading} />
    </div>
  );
}
