import './InstallmentTable.css';
import { formatVND } from '../utils/formatters';

export default function InstallmentTable({ data }) {
  if (!data || !data.summary || !data.schedule_preview) return null;

  const { summary, schedule_preview, warning, disclaimer } = data;

  return (
    <div className="installment-card glass">
      <div className="inst-header">
        <h4>Chi phí trả góp</h4>
        <span className="inst-rate">{summary.annual_interest_rate_percent}% / năm</span>
      </div>

      {warning && <div className="inst-warning">⚠️ {warning}</div>}

      <div className="inst-summary-grid">
        <div className="grid-item">
          <span className="lbl">Giá xe</span>
          <span className="val">{formatVND(summary.car_price_vnd)}</span>
        </div>
        <div className="grid-item">
          <span className="lbl">Trả trước ({summary.down_payment_percent}%)</span>
          <span className="val highlight">{formatVND(summary.down_payment_vnd)}</span>
        </div>
        <div className="grid-item">
          <span className="lbl">Số tiền vay</span>
          <span className="val">{formatVND(summary.loan_amount_vnd)}</span>
        </div>
        <div className="grid-item">
          <span className="lbl">Kỳ hạn</span>
          <span className="val">{summary.loan_term_months} tháng</span>
        </div>
      </div>

      <div className="inst-table-container">
        <table className="inst-table">
          <thead>
            <tr>
              <th>Kỳ</th>
              <th>Trả gốc</th>
              <th>Trả lãi</th>
              <th>Tổng cộng</th>
            </tr>
          </thead>
          <tbody>
            {schedule_preview.map((row) => (
              <tr key={row.month}>
                <td>{row.month}</td>
                <td>{formatVND(row.principal_vnd)}</td>
                <td>{formatVND(row.interest_vnd)}</td>
                <td className="bold">{formatVND(row.payment_vnd)}</td>
              </tr>
            ))}
            <tr>
              <td colSpan="4" className="table-dots">...</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="inst-total">
        <span className="lbl">Tổng lãi phải trả:</span>
        <span className="val">{formatVND(summary.total_interest_vnd)}</span>
      </div>

      {disclaimer && <div className="inst-disclaimer">{disclaimer}</div>}
    </div>
  );
}
