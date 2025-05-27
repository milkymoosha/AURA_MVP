from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import pyttsx3
from io import BytesIO
import os
import random
import tempfile
import requests
import json
import base64
import sys
import pythoncom  # Add this import for COM initialization

app = FastAPI()

# CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Read AURA's persona from file
try:
    with open(os.path.join(os.path.dirname(__file__), 'aura_persona.txt'), 'r') as file:
        AURA_PERSONA = file.read().strip()
except Exception as e:
    print(f"Warning: Could not read persona file: {e}")
    AURA_PERSONA = """You are AURA, a helpful and friendly 3D avatar chatbot.
Your primary goal is to be conversational, engaging, and provide assistance."""  # Fallback persona

# Define the model to use - llama3.2 requires less memory
MODEL_NAME = "llama3.2"

# Initialize text-to-speech engine at module level
try:
    pythoncom.CoInitialize()  # Initialize COM for the main thread
    tts_engine = pyttsx3.init()
    voices = tts_engine.getProperty('voices')
    # Set female voice if available
    for voice in voices:
        if voice.gender == 'female' or 'female' in voice.name.lower():
            tts_engine.setProperty('voice', voice.id)
            break
    # Adjust voice properties
    tts_engine.setProperty('rate', 150)    # Speed of speech
    tts_engine.setProperty('volume', 0.9)  # Volume level
except Exception as e:
    print(f"Warning: Could not initialize global TTS engine: {e}")
    tts_engine = None

class Message(BaseModel):
    message: str

def get_ollama_response(payload):
    """Helper function to handle Ollama's streaming response"""
    try:
        # Try to get model list first
        model_check = requests.get('http://localhost:11434/api/tags')
        if model_check.status_code != 200:
            raise Exception("Could not get model list from Ollama")
        
        # Set model name to lowercase
        if 'model' in payload:
            payload['model'] = payload['model'].lower()
        
        response = requests.post('http://localhost:11434/api/chat', json=payload, stream=True)
        if response.status_code == 404:
            raise Exception(f"Model '{payload.get('model', 'unknown')}' not found. Please run: ollama pull {MODEL_NAME}")
        response.raise_for_status()
        
        full_response = ""
        for line in response.iter_lines():
            if line:
                try:
                    chunk = json.loads(line)
                    if 'message' in chunk and 'content' in chunk['message']:
                        full_response += chunk['message']['content']
                except json.JSONDecodeError as e:
                    print(f"Error decoding JSON chunk: {e}")
                    print(f"Problematic line: {line}")
                    continue
        
        if not full_response:
            raise Exception("No response received from Ollama")
            
        return full_response.strip()
    except requests.exceptions.ConnectionError:
        raise Exception("Could not connect to Ollama. Make sure Ollama is running (ollama serve)")
    except Exception as e:
        if "not found" in str(e).lower():
            raise Exception(f"Model not found. Please run: ollama pull {MODEL_NAME}")
        if "requires more system memory" in str(e).lower():
            raise Exception(f"Not enough memory to run the model. Trying to use {MODEL_NAME} instead.")
        raise Exception(f"Error getting response from Ollama: {str(e)}")

def create_audio_response(text):
    """Helper function to generate audio from text"""
    try:
        # Re-initialize engine for this request
        pythoncom.CoInitialize()
        engine = pyttsx3.init()
        
        # Configure voice - specifically look for Zira
        voices = engine.getProperty('voices')
        for voice in voices:
            if 'zira' in voice.name.lower():
                engine.setProperty('voice', voice.id)
                break
        
        # Adjust properties
        engine.setProperty('rate', 150)
        engine.setProperty('volume', 0.9)
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmpfile:
            tmp_path = tmpfile.name
            
        # Save audio to file
        engine.save_to_file(text, tmp_path)
        engine.runAndWait()
        
        # Verify file exists and has content
        if not os.path.exists(tmp_path):
            raise Exception("Audio file was not created")
        
        if os.path.getsize(tmp_path) == 0:
            raise Exception("Audio file is empty")
            
        # Read the file
        with open(tmp_path, 'rb') as audio_file:
            audio_data = audio_file.read()
            
        # Clean up
        try:
            os.remove(tmp_path)
        except Exception as e:
            print(f"Warning: Could not delete temp file {tmp_path}: {e}")
            
        # Clean up engine
        try:
            engine.stop()
        except:
            pass
            
        pythoncom.CoUninitialize()
        
        return audio_data
    except Exception as e:
        print(f"Error in create_audio_response: {e}")
        print(f"Error type: {type(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise

@app.post("/chat")
async def chat_with_aura(msg: Message):
    try:
        if not msg.message.strip():
            raise HTTPException(status_code=400, detail="Message cannot be empty")
            
        payload = {
            "model": MODEL_NAME,
            "messages": [
                {"role": "system", "content": AURA_PERSONA},
                {"role": "user", "content": msg.message}
            ]
        }
        
        reply = get_ollama_response(payload)
        if not reply:
            raise HTTPException(status_code=500, detail="No response received from AI model")
            
        return {"reply": reply}
    except Exception as e:
        error_msg = str(e)
        if "not found" in error_msg.lower():
            error_msg = f"Model not installed. Please run: ollama pull {MODEL_NAME}"
        print(f"Error in /chat: {error_msg}")
        print(f"Error type: {type(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=error_msg)

@app.post("/speak")
async def speak_with_aura(msg: Message):
    try:
        if not msg.message.strip():
            raise HTTPException(status_code=400, detail="Message cannot be empty")
            
        # Get response from Ollama
        payload = {
            "model": MODEL_NAME,
            "messages": [
                {"role": "system", "content": AURA_PERSONA},
                {"role": "user", "content": msg.message}
            ]
        }
        
        reply = get_ollama_response(payload)
        if not reply:
            raise HTTPException(status_code=500, detail="No response received from AI model")

        # Animation keyword matching (checks both user's message and AI's reply)
        animation_state = "talk1"  # default animation
        message_lower = (msg.message + " " + reply).lower()
        
        if "dance" in message_lower:
            animation_state = "dance"
        elif "arms" in message_lower or "wave" in message_lower:
            animation_state = "arms"
        elif "situps" in message_lower or "exercise" in message_lower:
            animation_state = "situps"
        else:
            animation_state = random.choice(["talk1", "talk2"])

        # Generate audio response
        try:
            audio_data = create_audio_response(reply)
            if not audio_data:
                raise Exception("No audio data generated")
        except Exception as e:
            print(f"TTS Error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Text-to-speech error: {str(e)}")

        # Create response with headers - use base64 encoding for the reply to avoid encoding issues
        encoded_reply = base64.b64encode(reply.encode('utf-8')).decode('ascii')
        
        headers = {
            "X-Aura-Reply": encoded_reply,
            "X-Aura-Animation": animation_state,
            "Content-Disposition": 'inline; filename="aura_speech.mp3"',
            "Access-Control-Expose-Headers": "X-Aura-Reply, X-Aura-Animation"
        }

        # Return the audio stream
        return StreamingResponse(
            BytesIO(audio_data), 
            media_type="audio/mp3", 
            headers=headers
        )

    except Exception as e:
        print(f"Error in /speak: {str(e)}")
        print(f"Error type: {type(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))
