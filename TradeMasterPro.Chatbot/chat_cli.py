import sys
import os
from database import SessionLocal
from models import User
from chatbot_service import ChatbotService

def main():
    db = SessionLocal()
    
    # Fetch first active student from database, or fallback to dummy user
    student = db.query(User).filter(User.Role == "Student").first()
    
    if not student:
        print("No student found in the database. Creating a temporary test student...")
        student = User(
            Name="Test User",
            Email="testuser@trademaster.com",
            PasswordHash="mock_hash",
            Role="Student",
            Tier="Free"
        )
        db.add(student)
        db.commit()
        db.refresh(student)

    print(f"==================================================")
    print(f"   TradeMaster Pro AI Chatbot CLI Testing Tool    ")
    print(f"==================================================")
    print(f"Logged in as student: {student.Name} (Tier: {student.Tier})")
    print(f"Type your message and press Enter. Type 'exit' to quit.\n")

    # Initialize Gemini and OpenAI API keys from environment config (if any)
    gemini_key = os.getenv("GEMINI_API_KEY", "")
    openai_key = os.getenv("OPENAI_API_KEY", "")

    chatbot_service = ChatbotService(db, gemini_key, openai_key)

    while True:
        try:
            message = input("You: ")
            if not message.strip():
                continue
                
            if message.strip().lower() == "exit":
                print("Goodbye!")
                break
                
            response = chatbot_service.process_message(student.Id, message)
            
            print(f"\nBot: {response.response}")
            if response.suggestedActions:
                print(f"Suggested Actions: {', '.join(response.suggestedActions)}")
            print("-" * 50)
            
        except KeyboardInterrupt:
            print("\nGoodbye!")
            break
        except Exception as e:
            print(f"\nError processing message: {e}")
            print("-" * 50)

if __name__ == "__main__":
    main()
