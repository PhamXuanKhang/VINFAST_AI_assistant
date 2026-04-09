"""VinFast AI Tools — Registry & Export"""

from src.tools.car_info import get_car_info
from src.tools.promotions import get_promotions
from src.tools.installment import calculate_installment
from src.tools.lead import save_lead, schedule_appointment

# All tools for LangGraph ToolNode
TOOLS = [get_car_info, get_promotions, calculate_installment, save_lead, schedule_appointment]
