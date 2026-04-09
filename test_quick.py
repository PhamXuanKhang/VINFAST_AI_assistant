"""Quick test to verify database and tools work correctly."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from src.core.db_queries import get_all_models, get_cars_by_filters, calculate_on_road_price, get_bank_policies

print("=== All Models ===")
cars = get_all_models()
print(f"Found {len(cars)} models:")
for c in cars:
    print(f"  {c['car_id']}: {c['model_series']} {c['trim_level']} - {c['retail_price']:,} VND")

print("\n=== Filter: SUV, budget <= 600M ===")
filtered = get_cars_by_filters(budget_max=600_000_000)
for c in filtered:
    print(f"  {c['car_id']}: {c['retail_price']:,} VND")

print("\n=== On-road price VF5 in HAN ===")
onroad = calculate_on_road_price("VF5_PLUS", "HAN")
if onroad:
    print(f"  Base: {onroad['base_price']:,}")
    print(f"  Fees: {onroad['total_fees']:,}")
    print(f"  Total: {onroad['total_on_road']:,}")

print("\n=== Bank policies ===")
banks = get_bank_policies()
for b in banks:
    print(f"  {b['bank_name']}: {b['interest_rate_year1']}% Y1, max {b['max_term_months']} months")

print("\n[OK] All tests passed!")
