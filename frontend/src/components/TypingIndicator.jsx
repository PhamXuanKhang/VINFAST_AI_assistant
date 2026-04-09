import './TypingIndicator.css';

export default function TypingIndicator() {
  return (
    <div className="typing-wrapper">
      <div className="ai-avatar-mini">
        <span>V</span>
      </div>
      <div className="typing-bubble">
        <span className="typing-dot" style={{ animationDelay: '0ms' }}></span>
        <span className="typing-dot" style={{ animationDelay: '160ms' }}></span>
        <span className="typing-dot" style={{ animationDelay: '320ms' }}></span>
      </div>
    </div>
  );
}
