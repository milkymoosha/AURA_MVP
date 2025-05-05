# ✨ AURA – 3D AI Avatar Chatbot 👩‍💻🧠💬

![AURA Banner](https://your-banner-link.com) <!-- optional: add banner image -->

> 🚀 **Real-time AI. 3D Avatar. Lip Sync. Animations. Premium UI.**  
> 🧬 Powered by Google Gemini | 💻 Built with Python, React & Three.js


---

## 🧩 Features

🗣️ **Voice & Text Chat**  
🎭 **3D Avatar with Lip Sync**  
🎬 **Real-time Animations** (Idle, Talking, Dancing, Stretching, Pushups)  
🎨 **Sleek UI** with Call Layout + Integrated Chat  
⚙️ **Modular GLB-based Animation System**  
🧠 **Smart Response Engine using Gemini API**

---

![AURA May 5, 2025, 04_59_44 PM](https://github.com/user-attachments/assets/8b4a2de8-965a-4d7b-876c-aa122734327e)



## 🛠️ Tech Stack

| Layer      | Tech                          |
|-----------:|-------------------------------|
| 💻 Frontend | React, TailwindCSS, Three.js |
| 🎮 Avatar   | GLTF/GLB, Drei, @react-three/fiber |
| 🧠 Backend  | Python, FastAPI               |
| 🤖 AI       | Google Gemini API             |

---

## 🔄 Animation Triggers

| Action        | Animation File          |
|---------------|-------------------------|
| Idle (default)| `idle.glb`              |
| Talking       | `talking.glb` *(auto)*  |
| Dance (🎵)     | `dance.glb` *(on cue)*  |
| Arm Stretch   | `arms.glb`              |
| Push Ups      | `situps.glb`            |

⏺️ All files in `/public/models/`

---

## ⚡ Installation

**bash**
git clone https://github.com/yourusername/aura.git
cd aura
npm install # or yarn
npm run dev


Make sure your Python backend is running with:
uvicorn main:app --reload


🧪 Sneak Peek
👁️ Avatar visible in the top section
💬 Real-time chat box at the bottom
🔊 Voice mode with auto-talking animation
🎛️ Toggle buttons to trigger animations

🧠 Gemini Integration
Connected via Python backend using Google Gemini SDK.
Responses are streamed and synced with talking animation.


📁 Project Structure
/aura
 ┣ /public
 ┃ ┗ /models           ← GLB animation files
 ┣ /src
 ┃ ┣ /components
 ┃ ┣ /three            ← Avatar logic
 ┃ ┗ App.jsx
 ┣ /backend
 ┃ ┗ main.py           ← FastAPI + Gemini


🧿 Goals
 Real-time Avatar Chat
 Lip Sync & Voice Mode
 Trigger-based Animations
 Emotions / Facial Expressions (🧪 WIP)
 Meeting Mode AI Agent (🧠 Coming soon)

🧠 built by Madhav(a.k.a. Milkymoosha) and team


## License

AURA is open-source and licensed under the MIT License.  
See the [LICENSE](./LICENSE) file for more info.
