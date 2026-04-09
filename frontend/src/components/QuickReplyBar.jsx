import './QuickReplyBar.css';

export default function QuickReplyBar({ replies, onSelect }) {
  if (!replies || replies.length === 0) return null;

  return (
    <div className="quick-reply-bar">
      {replies.map((text, idx) => (
        <button
          key={idx}
          className="quick-reply-btn"
          onClick={() => onSelect(text)}
        >
          {text}
        </button>
      ))}
    </div>
  );
}
