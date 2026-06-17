from sqlalchemy.orm import Session
from models import User, Signal, Subscription, Trade, Plan
import datetime
from decimal import Decimal

class ChatbotResponse:
    def __init__(self, response: str, suggested_actions: list = None):
        self.response = response
        self.suggestedActions = suggested_actions or []

class ChatbotService:
    def __init__(self, db: Session, gemini_key: str = "", openai_key: str = ""):
        self.db = db
        self.is_ai_configured = bool(gemini_key or openai_key)

    def process_message(self, user_id: int, message: str) -> ChatbotResponse:
        if not message or not message.strip():
            return ChatbotResponse("Please type a message.")
            
        normalized = message.strip().lower()
        
        if not self.is_ai_configured:
            return self._process_mock_nlp(user_id, normalized)
            
        # TODO: Production AI integration (OpenAI/Gemini Call)
        return ChatbotResponse("AI service is running in mock mode.")
        
    def _process_mock_nlp(self, user_id: int, message: str) -> ChatbotResponse:
        student = self.db.query(User).filter(User.Id == user_id).first()
        if not student:
            return ChatbotResponse("User not found.")
            
        # GREETING
        if message in ["hello", "hi", "hey", "assalam o alaikum"]:
            welcome = f"Hi {student.Name}! I am your TradeMaster Pro AI Assistant. How can I help you today?"
            return ChatbotResponse(welcome, ["Show my trades", "View active signals", "My PnL summary", "Copy latest signal"])
            
        # TRADES
        if "trade" in message or "position" in message or "open" in message:
            trades = self.db.query(Trade).filter(Trade.StudentId == user_id).all()
            if not trades:
                return ChatbotResponse(
                    "You do not have any trades logged in the system currently.",
                    ["View active signals", "Copy latest signal"]
                )
            
            lines = ["📈 **Your Trades History:**"]
            for t in trades:
                outcome_tag = "🟢 OPEN" if t.Outcome == "Open" else ("🏆 WIN" if t.Outcome == "Win" else "❌ LOSS")
                exit_price = str(t.ExitPrice) if t.ExitPrice is not None else "N/A"
                pnl = str(t.Pnl) if t.Pnl is not None else "0.00"
                lines.append(f"- **Trade #{t.Id}** | Signal ID: #{t.SignalId} | Entry: ${t.EntryPrice} | Exit: ${exit_price} | PnL: ${pnl} | Status: {outcome_tag}")
                
            return ChatbotResponse("\n".join(lines), ["My PnL summary", "View active signals"])

        # SIGNALS
        if "signal" in message:
            student_plan = student.Tier or "Free"
            
            # Fetch signals matching plan
            if student_plan.lower() in ["basic", "free"]:
                free_teachers = self.db.query(User.Id).filter(User.Role == "Teacher", User.Tier == "Free").all()
                free_teacher_ids = [t[0] for t in free_teachers]
                signals = self.db.query(Signal).filter(Signal.TeacherId.in_(free_teacher_ids), Signal.Status == "Active").order_by(Signal.CreatedAt.desc()).limit(5).all()
            elif student_plan.lower() == "silver":
                free_teachers = self.db.query(User.Id).filter(User.Role == "Teacher", User.Tier == "Free").all()
                free_teacher_ids = [t[0] for t in free_teachers]
                
                sub_teachers = self.db.query(Subscription.TeacherId).filter(Subscription.StudentId == user_id, Subscription.Status == "Active").all()
                sub_teacher_ids = [t[0] for t in sub_teachers]
                
                allowed_ids = list(set(free_teacher_ids + sub_teacher_ids))
                signals = self.db.query(Signal).filter(Signal.TeacherId.in_(allowed_ids), Signal.Status == "Active").order_by(Signal.CreatedAt.desc()).limit(5).all()
            else: # Gold/Platinum
                signals = self.db.query(Signal).filter(Signal.Status == "Active").order_by(Signal.CreatedAt.desc()).limit(5).all()
                
            if not signals:
                return ChatbotResponse("There are currently no active signals available for your subscription plan.")
                
            lines = ["🎯 **Active Trading Signals Available:**"]
            for s in signals:
                lines.append(f"- **[Signal #{s.Id}]** Pair: **{s.Pair}** | Action: **{s.Action.upper()}** | Entry: ${s.EntryLow}-${s.EntryHigh} | TP1: ${s.Tp1} | SL: ${s.Sl} | Leverage: {s.Leverage} ({s.RiskLevel} Risk)")
                
            return ChatbotResponse("\n".join(lines), ["Copy latest signal", "Show my trades"])

        # PNL PERFORMANCE
        if any(keyword in message for keyword in ["pnl", "profit", "loss", "summary", "performance"]):
            closed_trades = self.db.query(Trade).filter(Trade.StudentId == user_id, Trade.Outcome != "Open").all()
            if not closed_trades:
                return ChatbotResponse("You do not have any closed trades yet to calculate a PnL summary.")
                
            total_pnl = sum(float(t.Pnl or 0) for t in closed_trades)
            wins = sum(1 for t in closed_trades if t.Outcome == "Win")
            losses = sum(1 for t in closed_trades if t.Outcome == "Loss")
            win_rate = (wins / len(closed_trades)) * 100 if closed_trades else 0
            
            pnl_sign = "+" if total_pnl >= 0 else ""
            summary = f"📊 **Your Performance Summary:**\n- **Total Trades:** {len(closed_trades)}\n- **Total Net PnL:** {pnl_sign}${total_pnl:.2f}\n- **Wins:** {wins} 🏆\n- **Losses:** {losses} ❌\n- **Win Rate:** {win_rate:.1f}%"
            
            return ChatbotResponse(summary, ["Show my trades", "View active signals"])

        # SUBSCRIPTIONS
        if "sub" in message or "follow" in message:
            subs = self.db.query(Subscription).filter(Subscription.StudentId == user_id, Subscription.Status == "Active").all()
            if not subs:
                return ChatbotResponse("You are not currently subscribed to any teachers.", ["View active signals"])
                
            lines = ["👥 **Your Active Subscriptions:**"]
            for s in subs:
                teacher = self.db.query(User).filter(User.Id == s.TeacherId).first()
                plan = self.db.query(Plan).filter(Plan.Id == s.PlanId).first()
                start_date = s.StartDate.strftime("%d %b %Y") if s.StartDate else "N/A"
                lines.append(f"- **Teacher:** {teacher.Name if teacher else 'Unknown'} | **Plan:** {plan.Name if plan else 'Unknown'} | Started: {start_date}")
                
            return ChatbotResponse("\n".join(lines), ["View active signals"])

        # COPY LATEST SIGNAL
        if any(keyword in message for keyword in ["copy", "execute", "place"]):
            student_plan = student.Tier or "Free"
            latest_signal = None
            
            if student_plan.lower() in ["basic", "free"]:
                free_teachers = self.db.query(User.Id).filter(User.Role == "Teacher", User.Tier == "Free").all()
                free_teacher_ids = [t[0] for t in free_teachers]
                latest_signal = self.db.query(Signal).filter(Signal.TeacherId.in_(free_teacher_ids), Signal.Status == "Active").order_by(Signal.CreatedAt.desc()).first()
            elif student_plan.lower() == "silver":
                free_teachers = self.db.query(User.Id).filter(User.Role == "Teacher", User.Tier == "Free").all()
                free_teacher_ids = [t[0] for t in free_teachers]
                
                sub_teachers = self.db.query(Subscription.TeacherId).filter(Subscription.StudentId == user_id, Subscription.Status == "Active").all()
                sub_teacher_ids = [t[0] for t in sub_teachers]
                
                allowed_ids = list(set(free_teacher_ids + sub_teacher_ids))
                latest_signal = self.db.query(Signal).filter(Signal.TeacherId.in_(allowed_ids), Signal.Status == "Active").order_by(Signal.CreatedAt.desc()).first()
            else:
                latest_signal = self.db.query(Signal).filter(Signal.Status == "Active").order_by(Signal.CreatedAt.desc()).first()

            if not latest_signal:
                return ChatbotResponse("Could not find any active signal in your feed to copy right now.")
                
            # Execute mock trade
            entry = float(latest_signal.EntryLow + latest_signal.EntryHigh) / 2.0
            trade = Trade(
                StudentId=user_id,
                SignalId=latest_signal.Id,
                EntryPrice=Decimal(str(entry)),
                Outcome="Open"
            )
            self.db.add(trade)
            self.db.commit()
            
            response = f"🟢 **Trade Executed successfully!**\n- **Trade ID:** #{trade.Id}\n- **Signal:** #{latest_signal.Id} ({latest_signal.Pair})\n- **Action:** {latest_signal.Action.upper()}\n- **Entry Execution Price:** ${entry:.2f}\n- **Leverage:** {latest_signal.Leverage}\n- **Stop Loss:** ${latest_signal.Sl}\n- **Take Profit:** ${latest_signal.Tp1}"
            
            return ChatbotResponse(response, ["Show my trades", "My PnL summary"])

        # DEFAULT REPLY
        default_reply = (
            f"Hello {student.Name}! I didn't quite catch that. I am your TradeMaster Pro assistant. You can ask me:\n\n"
            f"💬 **'List signals'** to view current trading signals.\n"
            f"📈 **'Show my trades'** to see your open trading positions.\n"
            f"📊 **'PnL summary'** to see your wins/losses statistics.\n"
            f"👥 **'My subscriptions'** to check followed teachers.\n"
            f"🚀 **'Copy latest signal'** to open a trade automatically."
        )
        return ChatbotResponse(default_reply, ["View active signals", "Show my trades", "My PnL summary", "Copy latest signal"])
