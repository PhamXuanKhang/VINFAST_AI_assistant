import { useState, useEffect } from 'react';
import CarCard from './CarCard';
import InstallmentTable from './InstallmentTable';
import ContactForm from './ContactForm';
import FinanceOptionCard from './FinanceOptionCard';
import PriceSummaryCard from './PriceSummaryCard';
import { useChat } from '../hooks/useChat';
import './AiBubble.css';

export default function AiBubble({ message }) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState(null); // 'like' | 'dislike'
  const { send } = useChat(); // Allow components to send messages back

  // Parse markdown and extract component JSON blocks
  const [text, setText] = useState('');
  const [uiComponents, setUiComponents] = useState([]);

  useEffect(() => {
    if (!message.content) return;
    
    // Find all ```json blocks
    const jsonRegex = /```json\n([\s\S]*?)\n```/g;
    let match;
    const comps = [];
    let cleanText = message.content;

    while ((match = jsonRegex.exec(message.content)) !== null) {
      try {
        const parsed = JSON.parse(match[1]);
        if (parsed && parsed.component) {
          comps.push(parsed);
          // Remove from visible text
          cleanText = cleanText.replace(match[0], '');
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
    
    setText(cleanText.trim());
    setUiComponents(comps);
  }, [message.content]);


  const handleFeedback = (type) => {
    setFeedback(type);
  };

  const formatContent = (t) => {
    if (!t) return '';
    return t
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  };

  const renderUiComponent = (compConfig, idx) => {
    if (compConfig.component === 'CarCard') {
      return (
        <CarCard 
          key={idx} 
          car={compConfig.data} 
          onSelect={(id) => send(`Tôi chọn xe ${id}`)} 
        />
      );
    }
    if (compConfig.component === 'InstallmentTable') {
      return <InstallmentTable key={idx} data={compConfig.data} />;
    }
    if (compConfig.component === 'ContactForm') {
      return <ContactForm key={idx} onSubmit={(info) => send(info)} />;
    }
    if (compConfig.component === 'FinanceOptionCard') {
      return <FinanceOptionCard key={idx} onSelect={(opt) => send(opt)} />;
    }
    if (compConfig.component === 'PriceSummaryCard') {
      return <PriceSummaryCard key={idx} data={compConfig.data} />;
    }
    return null;
  };

  return (
    <div
      className={`ai-bubble-wrapper ${message.isError ? 'error' : ''}`}
      onMouseEnter={() => setShowFeedback(true)}
      onMouseLeave={() => setShowFeedback(false)}
    >
      <div className="ai-avatar-mini">
        <span>V</span>
      </div>
      <div className="ai-bubble">
        {text && (
          <div
            className="bubble-content"
            dangerouslySetInnerHTML={{ __html: formatContent(text) }}
          />
        )}
        
        {/* Render injected UI components */}
        {uiComponents.length > 0 && (
          <div className="bubble-rich-components">
            {uiComponents.map((c, idx) => renderUiComponent(c, idx))}
          </div>
        )}

        {showFeedback && !feedback && (
          <div className="feedback-bar">
            <button
              className="feedback-btn"
              onClick={() => handleFeedback('like')}
              title="Hữu ích"
            >👍</button>
            <button
              className="feedback-btn"
              onClick={() => handleFeedback('dislike')}
              title="Không chính xác"
            >👎</button>
          </div>
        )}
        {feedback && (
          <div className="feedback-done">
            {feedback === 'like' ? '👍' : '👎'} Cảm ơn phản hồi!
          </div>
        )}
      </div>
    </div>
  );
}
