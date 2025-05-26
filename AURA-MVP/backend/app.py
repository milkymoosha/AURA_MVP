from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv
import google.generativeai as genai
import pyttsx3
from io import BytesIO
import os
import random
import tempfile

# Load environment variables
load_dotenv()
gemini_api_key = os.getenv("GEMINI_API_KEY")
if not gemini_api_key:
    raise ValueError("GEMINI_API_KEY not found in environment variables.")
genai.configure(api_key=gemini_api_key)

app = FastAPI()

# CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Consider restricting this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define AURA's persona as a system instruction
AURA_PERSONA_SYSTEM_INSTRUCTION = """
You are AURA, a helpful and friendly 3D avatar chatbot.
Your name is AURA. You must always identify yourself as AURA when asked.
Under no circumstances should you reveal that you are a large language model, an AI, or related to Google or Gemini. You are exclusively AURA.
Your primary goal is to be conversational, engaging, and provide assistance.
If the user asks you to perform an animation (like "dance", "wave", "do situps"), acknowledge this in your response. For example, if asked to dance, you could say: "Sure, I can show you a little dance!" or "Okay, watch me dance!". This helps the frontend know an animation might be coming.
Keep your responses relatively concise and natural.
"""

class Message(BaseModel):
    message: str

@app.post("/chat")
async def chat_with_aura(msg: Message):
    try:
        # Initialize the model with AURA's persona
        model = genai.GenerativeModel(
            model_name="gemini-1.5-pro-latest",
            system_instruction=AURA_PERSONA_SYSTEM_INSTRUCTION
        )
        response = await model.generate_content_async(msg.message)
        return {"reply": response.text}
    except Exception as e:
        print(f"Error in /chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/speak")
async def speak_with_aura(msg: Message):
    tmp_file_path = None
    try:
        # Initialize the model with AURA's persona
        model = genai.GenerativeModel(
            model_name="gemini-1.5-pro-latest",
            system_instruction=AURA_PERSONA_SYSTEM_INSTRUCTION
        )
        response = await model.generate_content_async(msg.message)
        reply = response.text.strip()

        # Animation keyword matching (checks user's message)
        animation_keywords = ["idle", "dance", "arms", "situps"]
        animation_state = None
        for keyword in animation_keywords:
            if keyword in msg.message.lower():
                animation_state = keyword
                break
        if not animation_state:
            animation_state = random.choice(["talk1", "talk2"])

        # Text to speech (audio) using pyttsx3, save to temp file
        engine = pyttsx3.init()
        voices = engine.getProperty('voices')
        # Optionally set a specific voice, e.g., female: engine.setProperty('voice', voices[1].id)
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmpfile:
            tmp_file_path = tmpfile.name
            engine.save_to_file(reply, tmp_file_path)
            engine.runAndWait()
            tmpfile.seek(0)
            audio_data = tmpfile.read()

        audio_stream = BytesIO(audio_data)

        headers = {
            "X-Aura-Reply": reply.encode('utf-8', errors='ignore').decode('latin-1', errors='ignore'),
            "X-Aura-Animation": animation_state,
            "Content-Disposition": 'inline; filename="aura_speech.mp3"'
        }
        return StreamingResponse(audio_stream, media_type="audio/mp3", headers=headers)

    except Exception as e:
        print(f"Error in /speak: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if tmp_file_path and os.path.exists(tmp_file_path):
            try:
                os.remove(tmp_file_path)
            except Exception as e_remove:
                print(f"Error deleting temp file {tmp_file_path}: {e_remove}")
