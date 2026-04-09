"""
Tool: save_lead — Lưu thông tin liên hệ khách hàng
===================================================
Thu thập SĐT + tên → lưu vào SQLite bảng leads.
"""

import json
import re
from typing import Optional

from langchain_core.tools import tool

from src.core.db_queries import save_lead as db_save_lead, schedule_appointment as db_schedule_appointment


def _validate_phone_vn(phone: str) -> bool:
    """Validate Vietnamese phone number (10 digits, starts with 0)."""
    cleaned = re.sub(r"[\s\-\.]", "", phone.strip())
    return bool(re.match(r"^0\d{9}$", cleaned))


@tool
def save_lead(
    customer_phone: str,
    customer_name: Optional[str] = None,
    selected_car_id: Optional[str] = None,
    finance_summary: Optional[str] = None,
) -> str:
    """Lưu thông tin liên hệ khách hàng để tư vấn viên gọi lại.

    Sử dụng tool này khi khách đồng ý để lại số điện thoại để được tư vấn thêm,
    đặt cọc, hoặc đăng ký lái thử.

    Args:
        customer_phone: Số điện thoại khách hàng (10 số, VD: "0901234567")
        customer_name: Tên khách hàng (nếu có)
        selected_car_id: Mã xe đã chọn (nếu có, VD: "VF5_PLUS")
        finance_summary: Tóm tắt tài chính dạng text (nếu đã tính trả góp)

    Returns:
        Chuỗi JSON xác nhận lưu thành công hoặc lỗi validate.
    """
    # Validate phone
    if not customer_phone or not _validate_phone_vn(customer_phone):
        return json.dumps({
            "status": "error",
            "message": "Số điện thoại không hợp lệ. Vui lòng nhập 10 số (bắt đầu bằng 0).",
            "example": "0901234567"
        }, ensure_ascii=False)

    # Parse finance summary if it's a JSON string
    finance_dict = None
    if finance_summary:
        try:
            finance_dict = json.loads(finance_summary)
        except (json.JSONDecodeError, TypeError):
            finance_dict = {"raw": finance_summary}

    # Save to DB
    lead_id = db_save_lead(
        customer_phone=customer_phone.strip(),
        customer_name=customer_name,
        selected_car_id=selected_car_id,
        finance_summary=finance_dict,
    )

    return json.dumps({
        "status": "success",
        "lead_id": lead_id,
        "message": f"Cảm ơn{' ' + customer_name if customer_name else ''}! "
                   f"Tư vấn viên VinFast sẽ liên hệ bạn trong vòng 30 phút trong giờ làm việc.",
        "phone_saved": customer_phone.strip(),
    }, ensure_ascii=False)


@tool
def schedule_appointment(
    lead_id: int,
    customer_name: str,
    phone: str,
    car_model: str,
    showroom_id: str,
    showroom_name: str,
    datetime_str: str,
    finance_type: str = "NONE",
) -> str:
    """Đặt lịch lái thử hoặc xem xe tại showroom VinFast.

    Sử dụng tool này CÙNG VỚI HƯỚNG DẪN khi khách muốn trực tiếp hẹn xem xe hoặc lái thử.
    Bắt buộc phải lưu lead bằng save_lead trước để lấy lead_id.

    Args:
        lead_id: ID khách hàng lấy từ save_lead.
        customer_name: Tên khách hàng.
        phone: Số điện thoại.
        car_model: Dòng xe khách muốn xem (VD: "VF5_PLUS").
        showroom_id: ID của showroom.
        showroom_name: Tên của showroom.
        datetime_str: Ngày giờ hẹn mong muốn, VD: "2025-05-10 14:00".
        finance_type: Loại mua (Mua thẳng=FULL_PAY, Trả góp=INSTALLMENT, Chua quyet=NONE)

    Returns:
        JSON string chứa mã xác nhận.
    """
    try:
        code = db_schedule_appointment(
            lead_id=lead_id,
            customer_name=customer_name,
            phone=phone,
            car_model=car_model,
            finance_type=finance_type,
            showroom_id=showroom_id,
            showroom_name=showroom_name,
            appointment_datetime=datetime_str
        )
        return json.dumps({
            "status": "success",
            "confirmation_code": code,
            "message": f"Lịch hẹn của bạn đã được xác nhận vào {datetime_str} tại {showroom_name}. Mã xác nhận: {code}"
        }, ensure_ascii=False)
    except Exception as e:
        return json.dumps({
            "status": "error",
            "message": str(e)
        }, ensure_ascii=False)
