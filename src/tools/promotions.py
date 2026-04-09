"""
Tool: get_promotions — Tra cứu giá lăn bánh & khuyến mãi
=========================================================
Tính toán giá lăn bánh theo khu vực cho một dòng xe cụ thể.
"""

import json
from typing import Optional

from langchain_core.tools import tool

from src.core.db_queries import calculate_on_road_price, get_car_detail


@tool
def get_promotions(
    car_id: str,
    region: Optional[str] = "HAN",
) -> str:
    """Tính giá lăn bánh và tra cứu khuyến mãi cho một dòng xe VinFast cụ thể.

    Sử dụng tool này khi khách đã chọn được xe và muốn biết chi phí thực tế.
    Tool trả về bảng tổng hợp: giá niêm yết + phí + khuyến mãi = giá lăn bánh.

    Args:
        car_id: Mã xe — ví dụ "VF5_PLUS", "VF8_PLUS". Lấy từ kết quả get_car_info().
        region: Khu vực đăng ký — "HAN" (Hà Nội), "SGN" (TP.HCM), "PROVINCE" (tỉnh khác).
                Mặc định "HAN" nếu khách không nói rõ.

    Returns:
        Chuỗi JSON chứa chi tiết giá lăn bánh hoặc thông báo lỗi.
    """
    on_road = calculate_on_road_price(car_id, region or "HAN")

    if not on_road:
        car_detail = get_car_detail(car_id)
        if not car_detail:
            return json.dumps({
                "status": "error",
                "message": f"Không tìm thấy xe với mã '{car_id}'. Hãy kiểm tra lại car_id."
            }, ensure_ascii=False)
        return json.dumps({
            "status": "error",
            "message": f"Không có dữ liệu giá hoặc phí cho khu vực '{region}'."
        }, ensure_ascii=False)

    return json.dumps({
        "status": "success",
        "car_id": on_road["car_id"],
        "location": on_road["location"],
        "breakdown": {
            "base_price_vnd": on_road["base_price"],
            "registration_tax_vnd": on_road["registration_tax"],
            "plate_fee_vnd": on_road["plate_fee"],
            "inspection_fee_vnd": on_road["inspection_fee"],
            "road_usage_fee_vnd": on_road["road_usage_fee"],
            "insurance_civil_vnd": on_road["insurance_civil"],
            "total_fees_vnd": on_road["total_fees"],
        },
        "total_on_road_vnd": on_road["total_on_road"],
        "promo_note": on_road.get("promo_note"),
        "disclaimer": "Giá trên mang tính tham khảo, tư vấn viên sẽ xác nhận con số chính thức.",
    }, ensure_ascii=False)
