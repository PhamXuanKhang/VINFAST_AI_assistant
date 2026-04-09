import './UserBubble.css';

export default function UserBubble({ message }) {
  return (
    <div className="user-bubble-wrapper">
      <div className="user-bubble">
        <span className="user-text">{message.content}</span>
      </div>
    </div>
  );
}
