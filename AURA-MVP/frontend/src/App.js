import React, { useState, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import AvatarLoader from "./AvatarLoader.jsx";
import axios from "axios";
import "./App.css";

function App() {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [chatStarted, setChatStarted] = useState(false);
  const [animationState, setAnimationState] = useState("idle"); // Default animation state
  const [isTyping, setIsTyping] = useState(false);

  const handleMessageChange = (e) => {
    setMessage(e.target.value);
  };

  const sendMessage = async () => {
    if (message.trim() === "") return;

    setChatHistory((prev) => [...prev, { sender: "user", message }]);
    setMessage("");

    // Randomly choose talk1 or talk2 for variety
    const randomTalk = Math.random() < 0.5 ? "talk1" : "talk2";
    setAnimationState(randomTalk);
    setIsTyping(true);

    try {
      const response = await axios.post("http://127.0.0.1:8000/chat", {
        message: message,
      });

      setChatHistory((prev) => [
        ...prev,
        { sender: "ai", message: response.data.reply },
      ]);
    } catch (error) {
      console.error("Error sending message:", error);
      setChatHistory((prev) => [
        ...prev,
        { sender: "ai", message: "Sorry, I couldn't process your request." },
      ]);
    } finally {
      setAnimationState("idle");
      setIsTyping(false);
    }
  };

  // Handle slider change to update animation state
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
      {/* Slider to select animation */}
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

      {/* 3D Avatar Section */}
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

      {/* Chat Trigger Button */}
      {!chatStarted && (
        <button
          className="absolute bottom-6 bg-white text-black font-semibold py-2 px-6 rounded-full shadow-md hover:bg-gray-200 transition"
          onClick={() => setChatStarted(true)}
        >
          Start Chat
        </button>
      )}

      {/* Chat UI */}
      {chatStarted && (
        <div className="absolute bottom-6 w-full max-w-2xl px-4">
          <div className="bg-zinc-900 text-white rounded-2xl shadow-xl overflow-hidden">
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
            </div>
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
                className="px-5 py-3 bg-blue-600 text-white rounded-r-xl hover:bg-blue-500"
                onClick={sendMessage}
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
