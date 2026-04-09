import './CarCard.css';
import { formatCompactVND } from '../utils/formatters';

export default function CarCard({ car, onSelect }) {
  if (!car) return null;

  return (
    <div className="car-card glass">
      <div className="car-card-img-container">
        {car.image_url ? (
          <img src={car.image_url} alt={car.model} className="car-card-img" />
        ) : (
          <div className="car-card-img-placeholder">🚗</div>
        )}
        {car.promo && <div className="car-badge">Ưu đãi</div>}
      </div>
      <div className="car-card-content">
        <h3 className="car-model">{car.model}</h3>
        <p className="car-style">{car.body_style} • {car.seats} chỗ</p>
        
        <div className="car-specs">
          <div className="spec-item">
            <span className="spec-icon">🔋</span>
            <span className="spec-val">{car.range_km} km</span>
          </div>
          <div className="spec-item">
            <span className="spec-icon">⚡</span>
            <span className="spec-val">{car.battery_kwh} kWh</span>
          </div>
        </div>

        <div className="car-price-row">
          <span className="price-label">Giá từ:</span>
          <span className="price-val">{formatCompactVND(car.retail_price_vnd)}</span>
        </div>

        <button className="car-select-btn" onClick={() => onSelect(car.car_id)}>
          Chọn xe này
        </button>
      </div>
    </div>
  );
}
