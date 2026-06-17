import os
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from database import get_db
from auth import verify_jwt_token
from chatbot_service import ChatbotService
from trade_executor import TradeExecutor

load_dotenv()

app = FastAPI(
    title="TradeMaster Pro AI Chatbot API",
    description="Python microservice serving the TradeMaster AI assistant.",
    version="1.0"
)

# Enable CORS for frontend connection (React Native / Web app)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Models
class MessageRequest(BaseModel):
    message: str

@app.get("/")
def read_root():
    return {"status": "TradeMaster Pro Chatbot microservice is running."}

# POST /api/chatbot/message
@app.post("/api/chatbot/message", status_code=status.HTTP_200_OK)
def send_message(
    req: MessageRequest,
    current_user: dict = Depends(verify_jwt_token),
    db: Session = Depends(get_db)
):
    if not req.message or not req.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message content cannot be empty."
        )

    # Initialize Gemini and OpenAI API keys from environment config
    gemini_key = os.getenv("GEMINI_API_KEY", "")
    openai_key = os.getenv("OPENAI_API_KEY", "")

    chatbot_service = ChatbotService(db, gemini_key, openai_key)
    response = chatbot_service.process_message(current_user["id"], req.message)
    
    return response

# Internal Request Models
class SignalExecutionRequest(BaseModel):
    signal_id: int
    secret_token: str

# POST /api/bot/execute-signal (Secure endpoint called internally by C# backend)
@app.post("/api/bot/execute-signal", status_code=status.HTTP_200_OK)
async def execute_signal(
    req: SignalExecutionRequest,
    db: Session = Depends(get_db)
):
    shared_token = os.getenv("INTERNAL_BOT_TOKEN", "TradeMasterProSecretToken1212")
    if req.secret_token != shared_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid internal communication token."
        )

    executor = TradeExecutor(db)
    await executor.execute_signal_auto_copy(req.signal_id)
    return {"message": "Auto-copy trading process completed."}

if __name__ == "__main__":
    import uvicorn
    # Start the server locally on port 8000
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
