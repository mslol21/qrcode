# Sistema de Aprendizagem com QR Code 🚀

Um sistema web completo, divertido e interativo para aprendizagem gamificada através de QR Codes. Professor cria, aluno escaneia!

## 📁 Estrutura do Projeto

- `/backend`: API REST em Node.js com Express e MongoDB
- `/frontend`: Aplicação SPA em React com Vite

## 🚀 Como Rodar Localmente

### Pré-requisitos
- Node.js instalado (v16+)
- MongoDB rodando localmente na porta 27017 (padrão)
  - *Dica:* Se não tiver o MongoDB instalado, você pode usar um banco em nuvem como o MongoDB Atlas, bastando alterar a string de conexão no `backend/server.js` (ou criar um arquivo `.env` com `MONGO_URI`).

### Passo 1: Iniciar o Backend

Abra um terminal e rode:

```bash
cd backend
npm install
node server.js
```
*O backend rodará na porta 5000.*

### Passo 2: Iniciar o Frontend

Abra **outro** terminal e rode:

```bash
cd frontend
npm install
npm run dev
```
*O frontend rodará (geralmente) na porta 5173.*

---

## 🎮 Como Usar

1. **Área do Professor**: Acesse `http://localhost:5173/` (ou a URL que o Vite exibir). 
2. **Crie um Exercício**: Preencha a pergunta, as alternativas, escolha a resposta certa e clique em "Adicionar Exercício".
3. **Escaneie o QR Code**: Leia o QR Code gerado na lista (ou clique no link de "página do aluno" direto do PC) e teste o jogo!
4. **Responda!**: 
   - No celular (ou na nova aba), adicione seu nome, e o jogo começará.
   - Use o botão gigante de Som (🔊) para a sua pergunta ser lida em voz alta (usando Text-to-Speech nativo em PT-BR)!
   - Selecione a resposta e receba um feedback visual fantástico que as crianças vão amar!
