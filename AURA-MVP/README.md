# Project Structure

```
AURA-MVP/
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   └── models/
│   │       ├── idle.glb
│   │       ├── dance.glb
│   │       ├── arms.glb
│   │       ├── situps.glb
│   │       ├── talk1.glb
│   │       └── talk2.glb
│   │
│   ├── src/
│   │   ├── components/
│   │   │   ├── App.js          # Main application component
│   │   │   ├── Avatar.js       # 3D avatar handling component
│   │   │   ├── ChatInterface.js # Chat UI component
│   │   │   └── AudioHandler.js  # Audio processing component
│   │   │
│   │   ├── utils/
│   │   │   ├── animationUtils.js  # Animation helper functions
│   │   │   └── audioUtils.js      # Audio processing utilities
│   │   │
│   │   ├── styles/
│   │   │   └── main.css
│   │   │
│   │   └── index.js            # Application entry point
│   │
│   ├── package.json
│   └── webpack.config.js
│
├── backend/
│   ├── app.py                  # Main backend server
│   ├── routes/
│   │   └── api.py             # API endpoints
│   │
│   └── requirements.txt
│
└── package.json                # Root package.json
```
