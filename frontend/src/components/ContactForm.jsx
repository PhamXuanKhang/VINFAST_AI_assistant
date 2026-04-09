import { useState } from 'react';
import './ContactForm.css';

export default function ContactForm({ onSubmit }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!phone.trim()) {
      setError('Vui lòng nhập số điện thoại');
      return;
    }
    const phoneRegex = /^0\d{9}$/;
    const cleanPhone = phone.replace(/\s+/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      setError('Số điện thoại không hợp lệ (cần 10 số, bắt đầu bằng 0)');
      return;
    }

    setError('');
    onSubmit(`Tên: ${name || 'Khách'}, SĐT: ${cleanPhone}`);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="contact-form glass success">
        ✅ Thông tin đã được gửi. Tư vấn viên sẽ liên hệ sớm!
      </div>
    );
  }

  return (
    <div className="contact-form glass">
      <h4>Kết nối tư vấn viên</h4>
      <p className="contact-desc">Để lại thông tin để được hỗ trợ tốt nhất.</p>
      
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Tên của bạn (không bắt buộc)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="contact-input"
        />
        <input
          type="tel"
          placeholder="Số điện thoại (Bắt buộc)*"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="contact-input"
        />
        {error && <p className="contact-error">{error}</p>}
        <button type="submit" className="contact-btn">Gửi thông tin</button>
      </form>
    </div>
  );
}
