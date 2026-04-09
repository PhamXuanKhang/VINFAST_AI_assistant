import './FinanceOptionCard.css';

export default function FinanceOptionCard({ onSelect }) {
  return (
    <div className="finance-opt-card glass">
      <h4>Phương thức thanh toán</h4>
      <p className="finance-opt-desc">Bạn muốn mua xe theo hình thức nào?</p>
      <div className="finance-options">
        <button className="finance-opt-btn" onClick={() => onSelect('Mua thẳng')}>
          <span className="opt-icon">💳</span>
          <span className="opt-text">Mua thẳng</span>
        </button>
        <button className="finance-opt-btn" onClick={() => onSelect('Trả góp qua ngân hàng')}>
          <span className="opt-icon">📅</span>
          <span className="opt-text">Trả góp</span>
        </button>
      </div>
    </div>
  );
}
