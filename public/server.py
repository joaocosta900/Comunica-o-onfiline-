import os
import uvicorn
import subprocess
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
os.makedirs("dist", exist_ok=True)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str, sender: WebSocket):
        for connection in self.active_connections:
            if connection is sender:
                continue
            await connection.send_text(message)

manager = ConnectionManager()

class SMSRequest(BaseModel):
    number: str
    message: str

@app.post("/api/sos/sms")
async def send_sms(request: SMSRequest):
    try:
        # Calls termux-sms-send which is available when termux-api is installed
        result = subprocess.run(
            ["termux-sms-send", "-n", request.number, request.message],
            capture_output=True, text=True
        )
        if result.returncode == 0:
            return {"status": "success", "message": "SMS enviado com sucesso pelo Termux."}
        else:
            return {"status": "error", "message": f"Falha no Termux: {result.stderr}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.broadcast(data, sender=websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket)

UPLOAD_CHUNK_SIZE = 1024 * 1024  # 1MB por chunk

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    file_location = f"uploads/{file.filename}"
    with open(file_location, "wb+") as file_object:
        while chunk := await file.read(UPLOAD_CHUNK_SIZE):
            file_object.write(chunk)
    await file.close()
    return {"info": f"file '{file.filename}' saved at '{file_location}'"}

@app.get("/files")
async def list_files():
    files = os.listdir("uploads")
    return {"files": files}

@app.get("/download/{filename}")
async def download_file(filename: str):
    file_path = f"uploads/{filename}"
    if os.path.exists(file_path):
        return FileResponse(path=file_path, filename=filename)
    return {"error": "File not found"}

@app.get("/server.py")
async def dl_server():
    return FileResponse("public/server.py", filename="server.py")

@app.get("/hotspot.sh")
async def dl_hotspot():
    return FileResponse("public/hotspot.sh", filename="hotspot.sh")

# Serve dist
app.mount("/assets", StaticFiles(directory="dist/assets"), name="assets")

@app.get("/")
async def serve_index():
    index_path = "dist/index.html"
    if os.path.exists(index_path):
        with open(index_path, "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    return HTMLResponse(content="<h1>Interface Web não encontrada!</h1><p>Coloque a pasta dist/ com o build do React na mesma pasta do server.py</p>")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
