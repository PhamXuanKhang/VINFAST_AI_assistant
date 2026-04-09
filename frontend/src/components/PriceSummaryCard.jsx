import './PriceSummaryCard.css';
import { formatVND } from '../utils/formatters';

export default function PriceSummaryCard({ data }) {
  if (!data || !data.breakdown) return null;
  const bd = data.breakdown;

  return (
    <div className="price-summary-card glass">
      <div className="summary-header">
        <h4>Chi phí lăn bánh</h4>
        <span className="summary-loc">{data.location}</span>
      </div>

      <div className="summary-rows">
        <div className="summary-row">
          <span className="slbl">Giá niêm yết:</span>
          <span className="sval">{formatVND(bd.base_price_vnd)}</span>
        </div>
        <div className="summary-row indent">
          <span className="slbl">Lệ phí trước bạ:</span>
          <span className="sval">{formatVND(bd.registration_tax_vnd)}</span>
        </div>
        <div className="summary-row indent">
          <span className="slbl">Phí ra biển số:</span>
          <span className="sval">{formatVND(bd.plate_fee_vnd)}</span>
        </div>
        <div className="summary-row indent">
          <span className="slbl">Phí đăng kiểm + đường bộ:</span>
          <span className="sval">{formatVND(bd.inspection_fee_vnd + bd.road_usage_fee_vnd)}</span>
        </div>
        <div className="summary-row indent">
          <span className="slbl">Bảo hiểm TNDS:</span>
          <span className="sval">{formatVND(bd.insurance_civil_vnd)}</span>
        </div>
      </div>

      <div className="summary-total">
        <span className="tlbl">Tổng lăn bánh dự kiến:</span>
        <span className="tval highlight">{formatVND(data.total_on_road_vnd)}</span>
      </div>

      {data.promo_note && (
        <div className="summary-promo">🎁 {data.promo_note}</div>
      )}

      {data.disclaimer && <div className="summary-disc">⚠️ {data.disclaimer}</div>}
    </div>
  );
}
