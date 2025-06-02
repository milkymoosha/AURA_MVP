import React, { useState, useRef, useEffect, useCallback } from 'react';
import './App.css';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Avatar from './avatar.js';
import { IoSend, IoMic } from 'react-icons/io5';

function App() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState('idle');
  const [isListening, setIsListening] = useState(false);
  const chatContainerRef = useRef(null);
  const audioRef = useRef(null);
  const recognitionRef = useRef(null);

  // Function to detect animation keyword in text
  const detectAnimationKeyword = useCallback((text) => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('dance')) return 'dance';
    if (lowerText.includes('exercise') || lowerText.includes('situp')) return 'situps';
    if (lowerText.includes('wave') || lowerText.includes('arm')) return 'arms';
    return null;
  }, []);

  const handleSendMessage = useCallback(async (e, voiceInput = null) => {
    if (e) e.preventDefault();
    
    const messageText = voiceInput || inputMessage;
    if (!messageText.trim()) return;

    // Keep avatar in idle state until response
    setCurrentAnimation('idle');

    const userMessage = {
      text: messageText,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText })
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const audioBlob = await response.blob();
      const auraReply = atob(response.headers.get('X-Aura-Reply'));
      
      // Determine the animation to use
      const detectedAnimation = detectAnimationKeyword(messageText);
      const serverAnimation = response.headers.get('X-Aura-Animation');
      const nextAnimation = detectedAnimation || serverAnimation || 'talk1';

      const auraMessage = {
        text: auraReply,
        sender: 'aura',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, auraMessage]);

      // Play audio and handle animation
      const audioUrl = URL.createObjectURL(audioBlob);
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        
        // Set up audio event handlers
        audioRef.current.onplay = () => {
          console.log('Starting animation:', nextAnimation);
          setCurrentAnimation(nextAnimation);
        };

        audioRef.current.onended = () => {
          console.log('Returning to idle animation');
          setCurrentAnimation('idle');
          URL.revokeObjectURL(audioUrl);
        };

        // Start playing the audio
        await audioRef.current.play().catch(error => {
          console.error('Audio playback error:', error);
          setCurrentAnimation('idle');
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'aura',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setCurrentAnimation('idle');
    } finally {
      setIsLoading(false);
    }
  }, [inputMessage, detectAnimationKeyword]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        handleSendMessage(null, transcript);
      };
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [handleSendMessage]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const toggleMicrophone = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  return (
    <div className="app-container">
      {/* Avatar Section */}
      <div className="avatar-container">
        <Canvas
          shadows="soft"
          camera={{
            position: [0, 2, 4],
            fov: 45,
            near: 0.1,
            far: 1000
          }}
        >
          {/* Environment and Lighting */}
          <color attach="background" args={['#2c3e50']} />
          <fog attach="fog" args={['#2c3e50', 10, 50]} />
          
          {/* Lights */}
          <ambientLight intensity={0.3} />
          <directionalLight
            castShadow
            position={[-2.5, 8, 5]}
            intensity={2}
            shadow-mapSize={[2048, 2048]}
            shadow-bias={-0.0001}
          >
            <orthographicCamera attach="shadow-camera" args={[-20, 20, -20, 20, 0.1, 50]} />
          </directionalLight>
          <directionalLight 
            position={[2.5, 5, 5]}
            intensity={0.8}
          />
          <pointLight position={[0, 2, 4]} color="white" intensity={0.3} />
          
          {/* Ground Plane with Grid */}
          <group position={[0, -1.5, 0]}>
            <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
              <planeGeometry args={[100, 100]} />
              <meshStandardMaterial 
                color="#2c3e50"
                opacity={0.6}
                transparent
                roughness={1}
                metalness={0}
                receiveShadow
              />
            </mesh>
            <gridHelper args={[30, 30, '#4c566a', '#4c566a']} position={[0, 0.01, 0]} />
          </group>

          {/* Avatar */}
          <group position={[0, -1.5, 0]}>
            <Avatar animation={currentAnimation} />
          </group>

          {/* Controls */}
          <OrbitControls
            enableZoom={true}
            enablePan={true}
            minDistance={2}
            maxDistance={25}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI * 0.75}
            target={[0, 0.5, 0]}
          />
        </Canvas>
      </div>

      {/* Chat Section */}
      <div className="chat-section">
        <div className="chat-header">
          <h2>Chat with AURA</h2>
          <div className="status-indicator">
            {isLoading ? 'Thinking...' : isListening ? 'Listening...' : 'Online'}
          </div>
        </div>

        <div className="chat-messages" ref={chatContainerRef}>
          {messages.map((message, index) => (
            <div
              key={index}
              className={`message ${message.sender === 'user' ? 'user-message' : 'aura-message'}`}
            >
              <div className="message-content">
                <p>{message.text}</p>
                <span className="message-timestamp">{message.timestamp}</span>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message aura-message">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSendMessage} className="chat-input">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={isLoading || isListening}
          />
          <button type="submit" disabled={isLoading || !inputMessage.trim() || isListening}>
            <IoSend />
          </button>
          <button 
            type="button" 
            className={`mic-button ${isListening ? 'listening' : ''}`}
            onClick={toggleMicrophone}
            disabled={isLoading}
          >
            <IoMic />
          </button>
        </form>
      </div>

      <audio ref={audioRef} />
    </div>
  );
}

export default App;
