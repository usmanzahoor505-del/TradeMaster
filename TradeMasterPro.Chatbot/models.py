from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey
from database import Base
import datetime

class User(Base):
    __tablename__ = 'Users'
    
    Id = Column("Id", Integer, primary_key=True, index=True)
    Name = Column("Name", String, nullable=False)
    Email = Column("Email", String, unique=True, nullable=False)
    PasswordHash = Column("PasswordHash", String, nullable=False)
    Role = Column("Role", String, default="Student")
    Tier = Column("Tier", String, default="Free")
    Status = Column("Status", String, default="Active")
    FcmToken = Column("FcmToken", String, nullable=True)
    CreatedAt = Column("CreatedAt", DateTime, default=datetime.datetime.utcnow)

class Signal(Base):
    __tablename__ = 'Signals'
    
    Id = Column("Id", Integer, primary_key=True, index=True)
    TeacherId = Column("TeacherId", Integer, nullable=False)
    Pair = Column("Pair", String, nullable=False)
    Action = Column("Action", String, nullable=False)
    EntryLow = Column("EntryLow", Numeric, nullable=False)
    EntryHigh = Column("EntryHigh", Numeric, nullable=False)
    Tp1 = Column("Tp1", Numeric, nullable=False)
    Tp2 = Column("Tp2", Numeric, nullable=True)
    Sl = Column("Sl", Numeric, nullable=False)
    Leverage = Column("Leverage", String, nullable=False)
    RiskLevel = Column("RiskLevel", String, default="LOW")
    Status = Column("Status", String, default="Active")
    CreatedAt = Column("CreatedAt", DateTime, default=datetime.datetime.utcnow)

class Subscription(Base):
    __tablename__ = 'Subscriptions'
    
    Id = Column("Id", Integer, primary_key=True, index=True)
    StudentId = Column("StudentId", Integer, nullable=False)
    TeacherId = Column("TeacherId", Integer, nullable=False)
    PlanId = Column("PlanId", Integer, nullable=False)
    StartDate = Column("StartDate", DateTime, default=datetime.datetime.utcnow)
    EndDate = Column("EndDate", DateTime, nullable=True)
    Status = Column("Status", String, default="Active")
    PaymentRef = Column("PaymentRef", String, nullable=True)

class Trade(Base):
    __tablename__ = 'Trades'
    
    Id = Column("Id", Integer, primary_key=True, index=True)
    StudentId = Column("StudentId", Integer, nullable=False)
    SignalId = Column("SignalId", Integer, nullable=False)
    EntryPrice = Column("EntryPrice", Numeric, nullable=False)
    ExitPrice = Column("ExitPrice", Numeric, nullable=True)
    Pnl = Column("Pnl", Numeric, nullable=True)
    Outcome = Column("Outcome", String, default="Open")
    ClosedAt = Column("ClosedAt", DateTime, nullable=True)

class Plan(Base):
    __tablename__ = 'Plans'
    
    Id = Column("Id", Integer, primary_key=True, index=True)
    Name = Column("Name", String, nullable=False)
    PriceUsd = Column("PriceUsd", Numeric, nullable=False)
    FeaturesJson = Column("FeaturesJson", String, default="{}")
    CommissionRate = Column("CommissionRate", Numeric, nullable=False)
    CreatedAt = Column("CreatedAt", DateTime, default=datetime.datetime.utcnow)

class ApiConnection(Base):
    __tablename__ = 'ApiConnections'
    
    Id = Column("Id", Integer, primary_key=True, index=True)
    StudentId = Column("StudentId", Integer, nullable=False)
    Exchange = Column("Exchange", String, nullable=False)
    EncryptedApiKey = Column("EncryptedApiKey", String, nullable=False)
    EncryptedSecret = Column("EncryptedSecret", String, nullable=False)
    Permissions = Column("Permissions", String, default="trade")
    CreatedAt = Column("CreatedAt", DateTime, default=datetime.datetime.utcnow)

