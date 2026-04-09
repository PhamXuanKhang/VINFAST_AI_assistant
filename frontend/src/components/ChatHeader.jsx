import './ChatHeader.css';

export default function ChatHeader({ onReset }) {
  return (
    <header className="chat-header glass">
      <div className="header-left">
        <div className="header-logo">
          <span className="logo-text">V</span>
        </div>
        <div className="header-info">
          <h1 className="header-title">Vivi AI</h1>
          <div className="header-status">
            <span className="status-dot"></span>
            <span className="status-text">Online</span>
          </div>
        </div>
      </div>
      <button className="header-reset-btn" onClick={onReset} title="Cuộc trò chuyện mới">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
          <path d="M3 3v5h5"/>
          <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
          <path d="M21 21v-5h-5"/>
        </svg>
      </button>
    </header>
  );
}
