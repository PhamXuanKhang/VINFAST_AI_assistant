import { useState, useCallback, useRef } from 'react';
import { sendMessage } from '../api/chatApi';

/**
 * Custom hook for chat state management
 */
export function useChat() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState(null);
  const [error, setError] = useState(null);
  const msgIdCounter = useRef(0);

  const generateId = () => {
    msgIdCounter.current += 1;
    return `msg-${Date.now()}-${msgIdCounter.current}`;
  };

  const send = useCallback(async (text) => {
    if (!text.trim() || isLoading) return;

    setError(null);

    // Add user message
    const userMsg = {
      id: generateId(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const data = await sendMessage(text.trim(), threadId);
      setThreadId(data.thread_id);

      // Add AI message
      const aiMsg = {
        id: generateId(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setError(err.message);
      const errorMsg = {
        id: generateId(),
        role: 'assistant',
        content: 'Xin lỗi, hệ thống đang gặp sự cố. Vui lòng thử lại sau hoặc liên hệ tư vấn viên.',
        timestamp: new Date(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, threadId]);

  const reset = useCallback(() => {
    setMessages([]);
    setThreadId(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { messages, isLoading, threadId, error, send, reset };
}
