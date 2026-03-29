# 🌐 Aura Healthcare AI Ecosystem

Welcome to the **Aura Healthcare AI Ecosystem** — a modular, scalable platform that integrates AI-powered healthcare analysis, mobile applications, Node.js backend services, and n8n automation workflows.

This system is designed to provide intelligent healthcare assistance by combining machine learning models, real-time APIs, and conversational automation.

---

---

# 📦 Repositories Breakdown

## 1️⃣ Aura Vikram (n8n Chat Integration)
🔗 https://github.com/Shobhit1260/Aura-Vikram.git  

### 📌 Description
Handles chat integration inside n8n workflows, enabling automated conversational pipelines connected to backend services.

### 🚀 Features
- Workflow-based chatbot integration
- API-triggered automation
- Event-driven responses
- Seamless backend connectivity

### 🛠 Tech Stack
- n8n
- Webhooks
- REST APIs

---

## 2️⃣ Aura Mobile App
🔗 https://github.com/coder-writes/aura-mobile-app  

### 📌 Description
A Flutter-based mobile application that serves as the main user interface.

### 🚀 Features
- Upload medical images (X-rays)
- Chat with AI assistant
- Real-time API interaction
- Clean UI/UX
- Cross-platform support

### 🛠 Tech Stack
- Flutter
- Dart

---

## 3️⃣ Aura Healthcare Backend
🔗 https://github.com/coder-writes/aura-healthcare-backend  

### 📌 Description
A Node.js-based backend that manages API requests, handles file uploads, and communicates with the AI model.

### 🚀 Features
- REST API endpoints (e.g., `/predict/tb`)
- Image upload handling
- AI model integration
- Middleware and request validation
- Scalable architecture

### 🛠 Tech Stack
- Node.js
- Express.js
- Multer

---

## 4️⃣ Aura AI Model
🔗 https://github.com/coder-writes/aura-ai-model  

### 📌 Description
Contains the fine-tuned deep learning model based on EfficientNet for detecting diseases such as tuberculosis from medical images.

### 🚀 Features
- EfficientNet-based architecture
- Image preprocessing pipeline
- Model training and evaluation
- Inference-ready model

### 🛠 Tech Stack
- Python
- TensorFlow / PyTorch
- EfficientNet
- OpenCV

---

## 5️⃣ Aura Chat Bot (n8n Automation)
🔗 https://github.com/Shobhit1260/aura-chat-bot  

### 📌 Description
Implements chatbot automation workflows using n8n, enabling structured and intelligent conversational flows.

### 🚀 Features
- AI-driven conversation handling
- Workflow automation
- API integration
- Trigger-based responses

### 🛠 Tech Stack
- n8n
- Webhooks
- REST APIs

---

# 🔗 System Workflow

## Step-by-step Process:
1. User interacts with the mobile app  
2. Image or input is sent to the Node.js backend  
3. Backend forwards data to the EfficientNet AI model  
4. Model processes and returns prediction  
5. n8n workflows enhance response via chatbot logic  
6. Final response is sent back to the user  

---

# ⚙️ Setup Instructions

## 1. Clone All Repositories
```bash
git clone https://github.com/Shobhit1260/Aura-Vikram.git
git clone https://github.com/coder-writes/aura-mobile-app
git clone https://github.com/coder-writes/aura-healthcare-backend
git clone https://github.com/coder-writes/aura-ai-model
git clone https://github.com/Shobhit1260/aura-chat-bot

cd aura-healthcare-backend
npm install
npm start

cd aura-ai-model
pip install -r requirements.txt
python inference.py

cd aura-mobile-app
flutter pub get
flutter run