"""
Tool: get_car_info — Tra cứu thông tin xe VinFast
==================================================
Truy vấn catalog xe VinFast theo filters: model, seats, budget, body_style.
"""

import json
from typing import Optional

from langchain_core.tools import tool

from src.core.db_queries import get_cars_by_filters, get_car_detail


@tool
def get_car_info(
    query: str,
    model: Optional[str] = None,
    seats: Optional[int] = None,
    budget_max: Optional[int] = None,
    body_style: Optional[str] = None,
) -> str:
    """Tra cứu thông tin xe VinFast (thông số kỹ thuật, giá, tính năng).

    Sử dụng tool này khi khách hỏi về xe VinFast — ví dụ: "VF5 giá bao nhiêu?",
    "xe nào 7 chỗ?", "xe dưới 600 triệu?".

    Args:
        query: Câu hỏi gốc của khách hàng (dùng để hiểu context).
        model: Tên dòng xe — ví dụ "VF 5", "VF5", "VF 8". Có thể None nếu khách chưa nêu.
        seats: Số chỗ ngồi yêu cầu — ví dụ 5, 7. Có thể None.
        budget_max: Ngân sách tối đa (VND) — ví dụ 600000000. Có thể None.
        body_style: Kiểu dáng xe — ví dụ "SUV", "sedan". Có thể None.

    Returns:
        Chuỗi JSON chứa danh sách xe phù hợp hoặc thông báo không tìm thấy.
    """
    cars = get_cars_by_filters(
        model_series=model,
        seats=seats,
        budget_max=budget_max,
        body_style=body_style,
    )

    if not cars:
        return json.dumps({
            "status": "no_results",
            "message": "Không tìm thấy xe phù hợp với tiêu chí lọc.",
            "suggestion": "Hãy thử mở rộng tiêu chí (bỏ một số filter) hoặc hỏi khách rõ hơn."
        }, ensure_ascii=False)

    # Format results cho LLM đọc dễ
    results = []
    for car in cars:
        specs = car.get("detailed_specs", {})
        result = {
            "car_id": car["car_id"],
            "model": f"{car['model_series']} {car['trim_level']}",
            "body_style": car.get("body_style"),
            "seats": car.get("seats"),
            "range_km": car.get("range_wltp_km"),
            "battery_kwh": car.get("battery_capacity"),
            "drivetrain": car.get("drivetrain"),
            "retail_price_vnd": car.get("retail_price"),
            "deposit_vnd": car.get("deposit_vnd"),
            "promo": car.get("promo_note"),
            "motor_power_kw": specs.get("motor_power_kw"),
            "charge_time_min": specs.get("charge_dc_0_70_min"),
            "has_adas": specs.get("has_adas"),
            "trunk_liters": specs.get("trunk_liters"),
        }
        results.append(result)

    return json.dumps({
        "status": "found",
        "count": len(results),
        "cars": results,
    }, ensure_ascii=False)
