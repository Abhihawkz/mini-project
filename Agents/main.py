from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage
import os
from typing import List, Optional
from dotenv import load_dotenv
load_dotenv()
app = FastAPI(title="Agon AI Chatbot", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Message(BaseModel):
    role: str  
    content: str

class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[Message]] = []
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 1000

class ChatResponse(BaseModel):
    success: bool
    message: str
    bot_name: str = "Agon"
    timestamp: str
    error: Optional[str] = None


def get_llm(temperature: float = 0.7, max_tokens: int = 1000):
    """Initialize Google Gemini LLM with LangChain"""
    api_key = os.getenv("GOOGLE_API_KEY")
    
    if not api_key:
        raise ValueError("GOOGLE_API_KEY environment variable not set")
    
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=api_key,
        temperature=temperature,
        max_output_tokens=max_tokens
    )
    return llm

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "bot_name": "Agon",
        "message": "Agon AI Chatbot is running!"
    }

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Main chat endpoint for Agon AI Chatbot
    
    Args:
        request: ChatRequest containing user message and conversation history
    
    Returns:
        ChatResponse with bot's reply in JSON format
    """
    try:
        from datetime import datetime
        
        llm = get_llm(
            temperature=request.temperature,
            max_tokens=request.max_tokens
        )
        
        messages = []
        
        system_prompt = SystemMessage(content="""You are Agon, a helpful and friendly AI assistant. 
        You provide clear, accurate, and concise responses to user questions. 
        You are knowledgeable across various topics and always maintain a professional yet approachable tone.
        If you don't know something, you admit it honestly.""")
        messages.append(system_prompt)
        
        for msg in request.conversation_history:
            if msg.role == "user":
                messages.append(HumanMessage(content=msg.content))
            elif msg.role == "assistant":
                messages.append(SystemMessage(content=f"Previous Agon response: {msg.content}"))
        
        messages.append(HumanMessage(content=request.message))
        
        response = llm.invoke(messages)
        
        # Return JSON response
        return ChatResponse(
            success=True,
            message=response.content,
            bot_name="Agon",
            timestamp=datetime.utcnow().isoformat()
        )
        
    except ValueError as ve:
        raise HTTPException(status_code=500, detail=str(ve))
    
    except Exception as e:
        return ChatResponse(
            success=False,
            message="",
            bot_name="Agon",
            timestamp=datetime.utcnow().isoformat(),
            error=f"An error occurred: {str(e)}"
        )

@app.get("/health")
async def health_check():
    """Detailed health check endpoint"""
    try:
        api_key = os.getenv("GOOGLE_API_KEY")
        return {
            "status": "healthy",
            "api_configured": bool(api_key),
            "bot_name": "Agon"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)