from datetime import datetime, time
from zoneinfo import ZoneInfo

ORDER_CUTOFF = time(21, 0)
INDIA_TIMEZONE = ZoneInfo("Asia/Kolkata")


def is_order_window_open() -> bool:
    current_time = datetime.now(INDIA_TIMEZONE).time()
    return current_time < ORDER_CUTOFF

def is_order_window_closed() -> bool:
    return not is_order_window_open()