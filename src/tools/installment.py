"""
Tool: calculate_installment — Tính toán trả góp xe VinFast
==========================================================
Pure deterministic computation — KHÔNG gọi LLM.
Tính gốc + lãi theo phương pháp dư nợ giảm dần.
"""

import json
import math

from langchain_core.tools import tool


@tool
def calculate_installment(
    car_price: int,
    down_payment_ratio: float,
    loan_term_months: int,
    annual_interest_rate: float,
) -> str:
    """Tính toán chi phí trả góp xe VinFast theo phương pháp dư nợ giảm dần.

    QUAN TRỌNG: Chỉ gọi tool này khi đã có ĐẦY ĐỦ cả 4 tham số.
    Nếu thiếu bất kỳ tham số nào, hãy hỏi khách hàng trước.

    Args:
        car_price: Giá xe bao gồm pin (VND). Ví dụ: 548000000
        down_payment_ratio: Tỷ lệ trả trước (0.0 - 1.0). Ví dụ: 0.3 = 30%
        loan_term_months: Kỳ hạn vay tháng: 12, 24, 36, 48, 60, 72, 84
        annual_interest_rate: Lãi suất năm (%). Ví dụ: 8.0 = 8%/năm

    Returns:
        Chuỗi JSON chứa bảng trả góp tháng đầu, tổng quan, và disclaimer.
    """
    # --- Validate inputs ---
    errors = []
    if car_price <= 0:
        errors.append("car_price phải > 0")
    if not (0.0 <= down_payment_ratio <= 1.0):
        errors.append("down_payment_ratio phải từ 0.0 đến 1.0")
    if loan_term_months <= 0:
        errors.append("loan_term_months phải > 0")
    if annual_interest_rate < 0 or annual_interest_rate > 30:
        errors.append("annual_interest_rate phải từ 0% đến 30%")

    if errors:
        return json.dumps({
            "status": "error",
            "errors": errors,
            "message": "Tham số không hợp lệ. Vui lòng kiểm tra lại.",
        }, ensure_ascii=False)

    # --- Calculate ---
    down_payment = int(car_price * down_payment_ratio)
    loan_amount = car_price - down_payment
    monthly_rate = (annual_interest_rate / 100) / 12
    principal_per_month = loan_amount / loan_term_months

    # Build amortization schedule (first 3 months + last month)
    schedule_preview = []
    total_interest = 0
    remaining = loan_amount

    for month in range(1, loan_term_months + 1):
        interest = remaining * monthly_rate
        total_interest += interest
        payment = principal_per_month + interest
        remaining -= principal_per_month

        if month <= 3 or month == loan_term_months:
            schedule_preview.append({
                "month": month,
                "principal_vnd": int(principal_per_month),
                "interest_vnd": int(interest),
                "payment_vnd": int(payment),
                "remaining_vnd": max(0, int(remaining)),
            })

    total_payment = car_price + total_interest  # bao gồm trả trước + gốc + lãi
    first_month_payment = int(principal_per_month + loan_amount * monthly_rate)

    # --- Sanity check (Failure path detection) ---
    is_abnormal = False
    if first_month_payment > car_price * 0.1:  # > 10% giá xe/tháng
        is_abnormal = True

    return json.dumps({
        "status": "warning" if is_abnormal else "success",
        "summary": {
            "car_price_vnd": car_price,
            "down_payment_vnd": down_payment,
            "down_payment_percent": round(down_payment_ratio * 100, 1),
            "loan_amount_vnd": loan_amount,
            "loan_term_months": loan_term_months,
            "annual_interest_rate_percent": annual_interest_rate,
            "first_month_payment_vnd": first_month_payment,
            "total_interest_vnd": int(total_interest),
            "total_payment_vnd": int(total_payment),
        },
        "schedule_preview": schedule_preview,
        "warning": "Số tiền trả hàng tháng khá cao so với giá xe. Vui lòng kiểm tra lại các tham số." if is_abnormal else None,
        "disclaimer": "⚠️ Bảng tính mang tính chất tham khảo. Tư vấn viên sẽ chốt con số cuối cùng.",
    }, ensure_ascii=False)
