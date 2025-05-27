import React, { useState, Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import AvatarLoader from "./AvatarLoader.jsx";
import "./App.css";

function App() {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [chatStarted, setChatStarted] = useState(false);
  const [animationState, setAnimationState] = useState("idle");
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setMessage(transcript);
        // Automatically send the message after voice input
        sendMessage(transcript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      setRecognition(recognition);
    } else {
      console.log('Speech Recognition not supported');
    }
  }, []);

  const toggleMicrophone = () => {
    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  const handleMessageChange = (e) => {
    setMessage(e.target.value);
  };

  const sendMessage = async (voiceInput = null) => {
    const messageToSend = voiceInput || message;
    if (messageToSend.trim() === "") return;

    setChatHistory((prev) => [...prev, { sender: "user", message: messageToSend }]);
    setMessage("");
    setIsTyping(true);
    setAnimationState("idle");  // Stay idle while typing

    try {
      const response = await fetch("http://localhost:8000/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageToSend }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Server error:", errorData);
        throw new Error(`Server error: ${errorData}`);
      }

      // Get reply from response header (for chat display)
      const encodedReply = response.headers.get("x-aura-reply");
      if (!encodedReply) {
        throw new Error("No reply received from server");
      }

      // Decode the base64 reply
      const reply = atob(encodedReply);

      // Get animation state from header
      const newAnimationState = response.headers.get("x-aura-animation");
      if (!newAnimationState) {
        console.warn("No animation state received, defaulting to idle");
      }

      // Clear typing indicator and update chat history immediately
      setIsTyping(false);
      setChatHistory((prev) => [
        ...prev,
        { sender: "ai", message: reply }
      ]);

      // Get audio stream and play it
      const audioBlob = await response.blob();
      if (audioBlob.size === 0) {
        throw new Error("Received empty audio data");
      }

      console.log("Audio blob size:", audioBlob.size, "bytes");

      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      // Set up audio event handlers before playing
      const playPromise = new Promise((resolve, reject) => {
        let playStarted = false;

        audio.oncanplaythrough = () => {
          console.log("Audio can play through");
          if (!playStarted) {
            playStarted = true;
            audio.play().catch(reject);
          }
        };

        audio.onplay = () => {
          console.log("Audio started playing");
          setIsSpeaking(true);
          if (newAnimationState) {
            console.log("Setting animation state to:", newAnimationState);
            setAnimationState(newAnimationState);
          }
        };
        
        audio.onended = () => {
          console.log("Audio ended, returning to idle state");
          setAnimationState("idle");
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          resolve();
        };

        audio.onerror = (e) => {
          console.error("Audio playback error:", e);
          console.error("Audio error code:", audio.error?.code);
          console.error("Audio error message:", audio.error?.message);
          setAnimationState("idle");
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          reject(new Error(`Audio playback failed: ${audio.error?.message || 'Unknown error'}`));
        };

        // Set a timeout in case the audio never starts playing
        setTimeout(() => {
          if (!playStarted) {
            reject(new Error("Audio playback timeout - failed to start"));
          }
        }, 5000);
      });

      // Wait for audio to complete
      await playPromise;

    } catch (error) {
      console.error("Error in chat:", error);
      setChatHistory((prev) => [
        ...prev,
        { sender: "ai", message: `Error: ${error.message}` }
      ]);
      setAnimationState("idle");
      setIsSpeaking(false);
    } finally {
      setIsTyping(false);
    }
  };

  const handleAnimationSlider = (e) => {
    const value = e.target.value;
    switch (parseInt(value)) {
      case 0:
        setAnimationState("idle");
        break;
      case 1:
        setAnimationState("dance");
        break;
      case 2:
        setAnimationState("situps");
        break;
      case 3:
        setAnimationState("arms");
        break;
      default:
        setAnimationState("idle");
    }
  };

  return (
    <div className="App bg-black min-h-screen w-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Animation Slider */}
      <div className="absolute top-4 right-6 z-10">
        <input
          type="range"
          min="0"
          max="3"
          step="1"
          value={["idle", "dance", "situps", "arms"].indexOf(animationState)}
          onChange={handleAnimationSlider}
          className="slider w-32"
        />
        <div className="text-white mt-2 text-sm">
          {animationState.charAt(0).toUpperCase() + animationState.slice(1)}
        </div>
      </div>

      {/* 3D Avatar */}
      <div className="w-full h-screen">
        <Canvas camera={{ position: [0, 1.5, 3] }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[2, 2, 2]} intensity={1.2} castShadow />
          <pointLight position={[-2, -2, -2]} intensity={0.5} />
          <Suspense fallback={null}>
            <AvatarLoader animationState={animationState} />
            <ContactShadows
              position={[0, -1.2, 0]}
              opacity={0.7}
              scale={10}
              blur={2.5}
              far={5}
              color="#ffffff"
            />
          </Suspense>
          <OrbitControls enablePan enableZoom enableRotate />
        </Canvas>
      </div>

      {/* Start Chat Button */}
      {!chatStarted && (
        <button
          className="absolute bottom-6 bg-white text-black font-semibold py-2 px-6 rounded-full shadow-md hover:bg-gray-200 transition"
          onClick={() => setChatStarted(true)}
        >
          Start Chat
        </button>
      )}

      {/* Chat Section */}
      {chatStarted && (
        <div className="absolute bottom-6 w-full max-w-2xl px-4">
          <div className="bg-zinc-900 text-white rounded-2xl shadow-xl overflow-hidden">
            {/* Messages */}
            <div className="max-h-80 overflow-y-auto p-4">
              {chatHistory.map((chat, index) => (
                <div
                  key={index}
                  className={`mb-3 flex ${chat.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <span
                    className={`px-4 py-2 rounded-xl ${
                      chat.sender === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-zinc-800 text-white"
                    }`}
                  >
                    {chat.message}
                  </span>
                </div>
              ))}
              {isTyping && (
                <div className="mb-3 flex justify-start">
                  <span className="px-4 py-2 rounded-xl bg-zinc-800 text-white italic">
                    Typing...
                  </span>
                </div>
              )}
              {isSpeaking && (
                <div className="mb-3 flex justify-start">
                  <span className="px-4 py-2 rounded-xl bg-zinc-800 text-white italic">
                    Speaking...
                  </span>
                </div>
              )}
            </div>
            {/* Input Box */}
            <div className="flex items-center border-t border-zinc-700 p-2">
              <input
                type="text"
                className="flex-1 p-2 rounded-l-lg text-black"
                placeholder="Type your message..."
                value={message}
                onChange={handleMessageChange}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button
                className={`px-4 py-3 ${isListening ? 'bg-red-600' : 'bg-green-600'} text-white mx-1 rounded-lg hover:opacity-90`}
                onClick={toggleMicrophone}
                title={isListening ? 'Stop Recording' : 'Start Recording'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                className="px-5 py-3 bg-blue-600 text-white rounded-r-xl hover:bg-blue-500"
                onClick={() => sendMessage()}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
