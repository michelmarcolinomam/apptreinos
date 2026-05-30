# Definição · Protocolo 8 Semanas

Tracker de treino periodizado em 3 blocos: Hipertrofia, Deload e Intensificação.

## Como subir (GitHub + Vercel)

### 1. Criar repositório no GitHub

- Vai em [github.com/new](https://github.com/new)
- Nome: `tracker-definicao` (ou o que preferir)
- Pode ser **público ou privado**, tanto faz pro Vercel
- **Não** marca "Add README" — já tem um aqui
- Clica em "Create repository"

### 2. Subir os arquivos

Tem 2 jeitos:

#### Jeito A: pelo navegador (mais fácil)

1. Na página do repo recém-criado, clica em **"uploading an existing file"**
2. Arrasta **todos os arquivos e pastas** desse projeto pra dentro
3. Escreve uma mensagem qualquer (ex: "first commit")
4. Clica em **"Commit changes"**

#### Jeito B: pelo terminal (se manja de git)

```bash
cd tracker-definicao
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/tracker-definicao.git
git push -u origin main
```

### 3. Deploy no Vercel

1. Vai em [vercel.com/new](https://vercel.com/new)
2. Clica em **"Import"** no repositório `tracker-definicao`
3. O Vercel já detecta que é Vite — **não muda nenhuma configuração**
4. Clica em **"Deploy"**
5. Em ~1 minuto fica pronto. Recebe uma URL tipo `tracker-definicao.vercel.app`

### 4. Adicionar à tela inicial do celular

**iPhone (Safari):**
- Abre a URL
- Toca no botão de compartilhar (quadradinho com seta)
- "Adicionar à Tela de Início"

**Android (Chrome):**
- Abre a URL
- Menu (3 pontinhos)
- "Adicionar à tela inicial" ou "Instalar app"

Pronto, vira um app de verdade, abre em tela cheia.

---

## Rodar localmente (opcional)

Se quiser testar antes de subir:

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`

---

## Como os dados são salvos

Os treinos ficam no **localStorage do navegador** — ou seja, ficam **só no celular** onde você usar. Se trocar de aparelho ou limpar o cache do navegador, **perde tudo**.

Pra fazer backup: abra o console do navegador e rode:

```js
copy(localStorage.getItem('tracker-periodized-v3'))
```

Cola num arquivo `.txt`. Pra restaurar:

```js
localStorage.setItem('tracker-periodized-v3', 'cole_o_conteudo_aqui')
```

---

## Atualizar depois

Se quiser mudar exercícios ou cargas, edita `src/App.jsx` (procura por `WORKOUT_PLAN`), faz commit no GitHub, e o Vercel publica automaticamente em segundos.
