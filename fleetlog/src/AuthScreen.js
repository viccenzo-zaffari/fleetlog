import React, { useState } from 'react'
import { supabase } from './supabaseClient'

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap');
  .auth-wrap { min-height: 100vh; background: #0d0f0e; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; font-family: 'DM Sans', sans-serif; }
  .auth-logo { font-family: 'DM Serif Display', serif; font-size: 36px; color: #eef2e6; margin-bottom: 6px; }
  .auth-logo span { color: #c8f53a; }
  .auth-sub { color: #7a8a72; font-size: 14px; margin-bottom: 40px; }
  .auth-card { background: #141714; border: 1px solid #2a2f29; border-radius: 24px; padding: 28px 24px; width: 100%; max-width: 400px; }
  .auth-title { font-family: 'DM Serif Display', serif; font-size: 22px; color: #eef2e6; margin-bottom: 20px; }
  .auth-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #7a8a72; margin-bottom: 6px; display: block; font-weight: 600; }
  .auth-input { width: 100%; background: #1c201b; border: 1px solid #2a2f29; border-radius: 12px; padding: 12px 14px; color: #eef2e6; font-family: 'DM Sans', sans-serif; font-size: 15px; outline: none; margin-bottom: 14px; box-sizing: border-box; transition: border 0.2s; }
  .auth-input:focus { border-color: #c8f53a; }
  .auth-btn { width: 100%; background: #c8f53a; color: #0d0f0e; border: none; border-radius: 14px; padding: 14px; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 600; cursor: pointer; margin-top: 4px; transition: background 0.2s; }
  .auth-btn:hover { background: #8fbf20; }
  .auth-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .auth-toggle { text-align: center; margin-top: 16px; font-size: 13px; color: #7a8a72; }
  .auth-toggle span { color: #c8f53a; cursor: pointer; font-weight: 500; }
  .auth-error { background: rgba(245,87,58,0.1); border: 1px solid rgba(245,87,58,0.3); border-radius: 10px; padding: 10px 14px; font-size: 13px; color: #f5573a; margin-bottom: 14px; }
  .auth-success { background: rgba(200,245,58,0.1); border: 1px solid rgba(200,245,58,0.3); border-radius: 10px; padding: 10px 14px; font-size: 13px; color: #c8f53a; margin-bottom: 14px; }
`

export default function AuthScreen() {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleLogin = async () => {
    setError(''); setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error.message)
    setLoading(false)
  }

  const handleRegister = async () => {
    setError(''); setLoading(true)
    if (!name.trim()) { setError('Digite seu nome.'); setLoading(false); return }
    if (password.length < 6) { setError('A senha precisa ter pelo menos 6 caracteres.'); setLoading(false); return }
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name } }
    })
    if (error) setError(error.message)
    else setSuccess('Conta criada! Verifique seu e-mail para confirmar o cadastro.')
    setLoading(false)
  }

  const handle = mode === 'login' ? handleLogin : handleRegister

  return (
    <>
      <style>{STYLES}</style>
      <div className="auth-wrap">
        <div className="auth-logo">Fleet<span>Log</span></div>
        <div className="auth-sub">Gestão completa de veículos</div>
        <div className="auth-card">
          <div className="auth-title">{mode === 'login' ? 'Entrar' : 'Criar conta'}</div>
          {error && <div className="auth-error">⚠️ {error}</div>}
          {success && <div className="auth-success">✓ {success}</div>}
          {mode === 'register' && (
            <><label className="auth-label">Seu nome</label>
            <input className="auth-input" placeholder="João Silva" value={name} onChange={e => setName(e.target.value)} /></>
          )}
          <label className="auth-label">E-mail</label>
          <input className="auth-input" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handle()} />
          <label className="auth-label">Senha</label>
          <input className="auth-input" type="password" placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : '••••••••'} value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handle()} />
          <button className="auth-btn" onClick={handle} disabled={loading || !email || !password}>
            {loading ? 'Aguarde…' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
          <div className="auth-toggle">
            {mode === 'login' ? <>Não tem conta? <span onClick={() => { setMode('register'); setError(''); setSuccess('') }}>Criar conta</span></> : <>Já tem conta? <span onClick={() => { setMode('login'); setError(''); setSuccess('') }}>Entrar</span></>}
          </div>
        </div>
      </div>
    </>
  )
}
