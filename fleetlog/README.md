# 🚗 FleetLog — Gestão de Veículos

App completo com login, dados na nuvem, fotos, FIPE e transferência de histórico.

---

## 🚀 Deploy — Passo a passo completo

### 1. Configurar o Supabase (banco de dados + login + fotos)

**a)** Acesse [supabase.com](https://supabase.com) → New Project → dê um nome → crie

**b)** No painel, vá em **SQL Editor** → cole o conteúdo de `SUPABASE_SETUP.sql` → Run

**c)** Crie o bucket de fotos:
- Vá em **Storage** → **New bucket**
- Nome: `vehicle-photos`
- Marque **Public** → Create

**d)** Pegue suas credenciais:
- Vá em **Settings** → **API**
- Copie `Project URL` e `anon public key`

---

### 2. Configurar variáveis no Netlify

No painel do Netlify → **Site settings** → **Environment variables** → Add:

```
REACT_APP_SUPABASE_URL      = https://xxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY = eyJhbGci...
```

---

### 3. Subir o código

**Opção A — Arrastar (sem GitHub):**
```bash
npm install
npm run build
# Arraste a pasta /build em app.netlify.com/drop
```

**Opção B — GitHub (deploy automático):**
```bash
git init && git add . && git commit -m "FleetLog v2"
git remote add origin https://github.com/seu-usuario/fleetlog.git
git push -u origin main
# Netlify: New site from Git → conecta o repo → Deploy
```

---

### 4. Habilitar confirmação de e-mail (opcional)

Por padrão o Supabase exige confirmar o e-mail.
Para desabilitar durante testes: **Authentication** → **Settings** → desmarque "Enable email confirmations"

---

## 📱 Instalar como app no celular

Após publicar no Netlify:
- **iPhone**: Safari → Compartilhar → Adicionar à Tela de Início
- **Android**: Chrome → Menu ⋮ → Adicionar à tela inicial

---

## 🗂 Estrutura

```
fleetlog/
├── src/
│   ├── App.js              ← App principal (toda a UI)
│   ├── AuthScreen.js       ← Tela de login/cadastro
│   ├── db.js               ← Todas operações com Supabase
│   ├── supabaseClient.js   ← Conexão com Supabase
│   └── index.js            ← Entry point
├── public/
│   ├── index.html
│   ├── manifest.json       ← PWA
│   └── sw.js               ← Offline
├── SUPABASE_SETUP.sql      ← Cole no SQL Editor do Supabase
├── .env.example            ← Modelo das variáveis de ambiente
├── netlify.toml
└── package.json
```

---

## ✅ O que funciona

- Login e cadastro com e-mail/senha
- Cada usuário vê só os próprios veículos
- Dados salvos no banco (não somem ao fechar)
- Fotos do veículo salvas na nuvem (Supabase Storage)
- Nota fiscal anexada a cada registro
- Busca automática de valor FIPE (API gratuita)
- Transferência de histórico para novo proprietário via link único
- Funciona como PWA (instala no celular)

