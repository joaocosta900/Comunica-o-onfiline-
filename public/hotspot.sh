#!/bin/bash
echo "=== INICIANDO MODO OFFLINE HUB ==="
echo "1. Ligue o 'Roteador Wi-Fi' (Hotspot) nas configurações do Android."
echo "2. Conecte os outros aparelhos na rede gerada."

IP=$(ifconfig wlan1 2>/dev/null | grep 'inet ' | awk '{print $2}')
if [ -z "$IP" ]; then
    IP=$(ifconfig ap0 2>/dev/null | grep 'inet ' | awk '{print $2}')
fi
if [ -z "$IP" ]; then
    IP=$(ifconfig wlan0 2>/dev/null | grep 'inet ' | awk '{print $2}')
fi

echo "3. O IP deste servidor na rede é: $IP"
echo "4. Acesse o aplicativo React neste dispositivo, ou digite http://$IP:8000 nos outros aparelhos para a API."
echo "Instalando dependencias do servidor..."
pip install fastapi uvicorn python-multipart
echo "Iniciando servidor Python na porta 8000..."
python public/server.py
