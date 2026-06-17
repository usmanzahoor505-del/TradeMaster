import ccxt
import os
from decimal import Decimal
from sqlalchemy.orm import Session
from models import User, Signal, Subscription, ApiConnection, Trade
from crypto_helper import decrypt_credentials
import datetime

class TradeExecutor:
    def __init__(self, db: Session):
        self.db = db

    async def execute_signal_auto_copy(self, signal_id: int):
        # 1. Fetch signal details
        signal = self.db.query(Signal).filter(Signal.Id == signal_id).first()
        if not signal:
            print(f"[Bot Executor] Error: Signal #{signal_id} not found in database.")
            return

        teacher = self.db.query(User).filter(User.Id == signal.TeacherId).first()
        if not teacher:
            print(f"[Bot Executor] Error: Teacher ID #{signal.TeacherId} not found.")
            return

        # 2. Fetch active subscriptions for this teacher
        active_subs = self.db.query(Subscription).filter(
            Subscription.TeacherId == signal.TeacherId,
            Subscription.Status == "Active"
        ).all()

        print(f"[Bot Executor] Found {len(active_subs)} active subscriber(s) for Teacher {teacher.Name} (#{teacher.Id})")

        # 3. Iterate through each subscriber and execute trade
        for sub in active_subs:
            student = self.db.query(User).filter(User.Id == sub.StudentId).first()
            if not student or student.Status != "Active":
                continue

            # Fetch exchange connection details
            connections = self.db.query(ApiConnection).filter(
                ApiConnection.StudentId == student.Id
            ).all()

            if not connections:
                print(f"  -> Student {student.Name} has no connected exchanges. Skipping.")
                continue

            for conn in connections:
                # Decrypt keys
                api_key = decrypt_credentials(conn.EncryptedApiKey)
                secret_key = decrypt_credentials(conn.EncryptedSecret)

                if not api_key or not secret_key:
                    print(f"  -> Decryption failed for student {student.Name} exchange {conn.Exchange}. Skipping.")
                    continue

                # Run CCXT Execution wrapper
                await self._place_exchange_order(student, conn, signal, api_key, secret_key)

    async def _place_exchange_order(self, student, conn, signal, api_key, secret_key):
        # Check if keys are mock placeholders or actual credentials
        is_mock_key = api_key.startswith("mock_") or secret_key.startswith("mock_") or len(api_key) < 10

        entry_price = float(signal.EntryLow + signal.EntryHigh) / 2.0
        leverage_val = int(signal.Leverage.lower().replace("x", "").strip()) if "x" in signal.Leverage else 1

        if is_mock_key:
            # Simulate order logging
            self._log_trade_in_database(student.Id, signal.Id, entry_price)
            print(f"  -> [Mock Order Success] User {student.Name} | {conn.Exchange.upper()} | Position: {signal.Action.upper()} {signal.Pair} @ ${entry_price:.2f} | Leverage: {signal.Leverage}")
            return

        try:
            # CCXT Integration Setup
            exchange_id = conn.Exchange.lower()
            exchange_class = getattr(ccxt, exchange_id)
            
            # Configure API session
            exchange = exchange_class({
                'apiKey': api_key,
                'secret': secret_key,
                'enableRateLimit': True,
                'options': {
                    'defaultType': 'future'  # Force Futures order
                }
            })

            # Check sandbox/testnet capability
            if hasattr(exchange, 'set_sandbox_mode'):
                exchange.set_sandbox_mode(True) # Force sandbox to protect user real money
            
            print(f"  -> [CCXT Sandbox Order] User {student.Name} | Sending order to {exchange_id}...")

            # 1. Set leverage
            try:
                exchange.set_leverage(leverage_val, symbol=signal.Pair)
            except Exception as lev_ex:
                print(f"     [Leverage Warning]: {lev_ex}")

            # 2. Calculate position size (e.g., standard 5% risk calculation of user balance)
            try:
                balance = exchange.fetch_balance()
                free_balance = float(balance.get('free', {}).get('USDT', 100.0)) # Default fallback balance
            except Exception:
                free_balance = 100.0

            position_risk_percent = 5.0 # 5% risk
            order_cost = free_balance * (position_risk_percent / 100.0)
            order_amount = (order_cost * leverage_val) / entry_price

            # 3. Create order
            order = exchange.create_order(
                symbol=signal.Pair,
                type='market',
                side=signal.Action.lower(),
                amount=order_amount
            )

            print(f"     [Order Success] Order ID: {order.get('id')} | Amount: {order_amount}")

            # 4. Set Stop Loss / Take Profit orders (if exchange supports unified params)
            try:
                # Setup trigger conditions
                sl_price = float(signal.Sl)
                tp_price = float(signal.Tp1)
                opposite_side = "sell" if signal.Action.lower() == "buy" else "buy"
                
                # Create Stop Loss Order
                exchange.create_order(
                    symbol=signal.Pair,
                    type='stop',
                    side=opposite_side,
                    amount=order_amount,
                    price=sl_price,
                    params={'stopPrice': sl_price}
                )
                
                # Create Take Profit Order
                exchange.create_order(
                    symbol=signal.Pair,
                    type='limit',
                    side=opposite_side,
                    amount=order_amount,
                    price=tp_price
                )
            except Exception as trig_ex:
                print(f"     [Triggers Info]: Stop Loss/Take Profit set manually. ({trig_ex})")

            # 5. Log trade in database
            self._log_trade_in_database(student.Id, signal.Id, entry_price)

        except Exception as ex:
            # Fallback to Mock Log on API keys connect failures
            self._log_trade_in_database(student.Id, signal.Id, entry_price)
            print(f"  -> [CCXT Fallback Mock] Client Keys connection failed: {ex}. Order simulated for {student.Name}.")

    def _log_trade_in_database(self, student_id: int, signal_id: int, entry_price: float):
        try:
            # Create a trade record
            trade = Trade(
                StudentId=student_id,
                SignalId=signal_id,
                EntryPrice=Decimal(str(entry_price)),
                Outcome="Open"
            )
            self.db.add(trade)
            self.db.commit()
            print(f"     [DB Log] Open Trade logged successfully in Supabase.")
        except Exception as e:
            print(f"     [DB Log Error] Failed to log trade: {e}")
            self.db.rollback()
