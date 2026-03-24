@echo off
echo Iniciando o Servidor Node (Backend)...
start cmd /k "cd backend && node server.js"

echo Iniciando o Front-End (Vite/React)...
start cmd /k "cd frontend && npm run dev"

echo Tudo pronto! Nao se esqueca que voce precisa do MongoDB rodando localmente (porta 27017).
