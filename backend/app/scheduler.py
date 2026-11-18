from datetime import datetime, time
from zoneinfo import ZoneInfo

from apscheduler.schedulers.background import BackgroundScheduler

from app.db.session import SessionLocal
from app.models.order import Order
from app.services.order import settle_community_orders

IST = ZoneInfo("Asia/Kolkata")

scheduler = BackgroundScheduler(timezone=IST)


def run_daily_settlement():
    db = SessionLocal()

    try:
        today = datetime.now(IST).date()

        # Find communities that have orders today
        communities = (
            db.query(Order.community_id)
            .filter(Order.order_date >= datetime.combine(today, time.min))
            .filter(Order.order_date < datetime.combine(today, time.max))
            .distinct()
            .all()
        )

        for (community_id,) in communities:
            settle_community_orders(db, community_id, today)

        print(f"Daily settlement completed for {today}")

    except Exception as e:
        db.rollback()
        print(f"Settlement scheduler error: {e}")

    finally:
        db.close()


def start_scheduler():
    scheduler.add_job(
        run_daily_settlement,
        trigger="cron",
        hour=21,
        minute=0,
        id="daily_bulk_settlement",
        replace_existing=True
    )

    scheduler.start()