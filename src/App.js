import React, { useState, useRef, useEffect, useCallback } from "react"
import { supabase, isConfigured } from "./supabaseClient"
import AuthScreen from "./AuthScreen"
import { fetchVehicles, insertVehicle, updateVehicle, fetchRecords, insertRecord, updateRecord, uploadPhoto, uploadReceipt, createTransfer } from "./db"

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');`

const STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0d0f0e; --surface: #141714; --surface2: #1c201b; --border: #2a2f29;
    --accent: #c8f53a; --accent2: #8fbf20; --text: #eef2e6; --muted: #7a8a72;
    --danger: #f5573a; --warning: #f5b83a;
  }
  body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; min-height: 100vh; }
  .serif { font-family: 'DM Serif Display', serif; }
  .app { max-width: 480px; margin: 0 auto; min-height: 100vh; position: relative; }
  .header { padding: 20px 20px 0; display: flex; align-items: center; justify-content: space-between; }
  .logo { font-family: 'DM Serif Display', serif; font-size: 22px; letter-spacing: -0.5px; }
  .logo span { color: var(--accent); }
  .user-menu { display: flex; align-items: center; gap: 10px; }
  .user-badge { width: 36px; height: 36px; border-radius: 50%; background: var(--accent); display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 13px; color: var(--bg); cursor: pointer; }
  .logout-btn { background: none; border: 1px solid var(--border); color: var(--muted); border-radius: 10px; padding: 6px 12px; font-size: 12px; cursor: pointer; font-family: 'DM Sans', sans-serif; }
  .logout-btn:hover { border-color: var(--danger); color: var(--danger); }
  .bottom-nav { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 480px; background: rgba(13,15,14,0.92); backdrop-filter: blur(20px); border-top: 1px solid var(--border); display: flex; justify-content: space-around; padding: 12px 0 20px; z-index: 100; }
  .nav-item { display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer; padding: 4px 16px; }
  .nav-item svg { opacity: 0.4; transition: all 0.2s; }
  .nav-item span { font-size: 10px; color: var(--muted); font-weight: 500; }
  .nav-item.active svg { opacity: 1; color: var(--accent); }
  .nav-item.active span { color: var(--accent); }
  .main { padding: 16px 20px 100px; }
  .greeting { margin-bottom: 20px; }
  .greeting p { color: var(--muted); font-size: 13px; margin-bottom: 2px; }
  .greeting h1 { font-family: 'DM Serif Display', serif; font-size: 28px; line-height: 1.1; }
  .spin { display: inline-block; animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .config-warn { background: rgba(245,184,58,0.1); border: 1px solid rgba(245,184,58,0.3); border-radius: 16px; padding: 20px; margin: 20px; text-align: center; }
  .config-warn h2 { font-family: 'DM Serif Display', serif; font-size: 20px; margin-bottom: 8px; color: var(--warning); }
  .config-warn p { font-size: 13px; color: var(--muted); line-height: 1.6; }
  .config-warn code { background: var(--surface2); padding: 2px 6px; border-radius: 4px; font-size: 12px; color: var(--accent); }

  .fipe-box { background: var(--surface2); border: 1px solid var(--border); border-radius: 16px; padding: 14px; margin-bottom: 14px; }
  .fipe-loading { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--muted); }
  .fipe-badge { display: flex; flex-direction: column; gap: 2px; background: rgba(200,245,58,0.1); border: 1px solid rgba(200,245,58,0.25); border-radius: 10px; padding: 10px 14px; margin-top: 10px; }
  .fipe-badge .fb-label { font-size: 11px; color: var(--muted); }
  .fipe-badge .fb-val { font-size: 18px; font-weight: 700; color: var(--accent); }
  .fipe-badge .fb-ref { font-size: 10px; color: var(--muted); }
  .fipe-error { font-size: 12px; color: var(--warning); padding: 6px 0; }
  .fipe-value-card { background: linear-gradient(135deg, rgba(200,245,58,0.08), rgba(200,245,58,0.02)); border: 1px solid rgba(200,245,58,0.2); border-radius: 16px; padding: 14px 16px; margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between; }

  .vtype-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 14px; }
  .vtype-btn { background: var(--surface2); border: 2px solid var(--border); border-radius: 14px; padding: 12px 6px; display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: pointer; transition: all 0.2s; }
  .vtype-btn.selected { border-color: var(--accent); background: rgba(200,245,58,0.08); }
  .vtype-btn .vt-emoji { font-size: 26px; }
  .vtype-btn .vt-label { font-size: 10px; color: var(--muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
  .vtype-btn.selected .vt-label { color: var(--accent); }

  .car-card { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; overflow: hidden; margin-bottom: 14px; cursor: pointer; transition: all 0.25s; }
  .car-card:hover { border-color: var(--accent); transform: translateY(-1px); }
  .car-card.active-card { border-color: var(--accent); }
  .car-visual { height: 140px; background: linear-gradient(135deg, #1a2018 0%, #0f1a0d 100%); display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }
  .car-visual::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 80%, rgba(200,245,58,0.08) 0%, transparent 70%); }
  .car-emoji { font-size: 72px; filter: drop-shadow(0 8px 24px rgba(200,245,58,0.15)); position: relative; }
  .car-photo-img { width: 100%; height: 100%; object-fit: cover; }
  .vtype-tag { position: absolute; top: 10px; left: 10px; background: rgba(13,15,14,0.75); backdrop-filter: blur(8px); border: 1px solid var(--border); color: var(--muted); font-size: 10px; font-weight: 600; padding: 3px 8px; border-radius: 20px; text-transform: uppercase; }
  .car-badge { position: absolute; top: 10px; right: 10px; background: var(--accent); color: var(--bg); font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 20px; }
  .fipe-chip { position: absolute; bottom: 10px; right: 10px; background: rgba(13,15,14,0.8); backdrop-filter: blur(8px); border: 1px solid rgba(200,245,58,0.3); color: var(--accent); font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; }
  .car-info { padding: 14px 16px; }
  .car-name { font-family: 'DM Serif Display', serif; font-size: 20px; margin-bottom: 2px; }
  .car-sub { font-size: 12px; color: var(--muted); display: flex; gap: 10px; flex-wrap: wrap; }
  .car-stats { display: flex; border-top: 1px solid var(--border); }
  .stat { flex: 1; padding: 12px 14px; display: flex; flex-direction: column; gap: 2px; }
  .stat + .stat { border-left: 1px solid var(--border); }
  .stat-val { font-size: 15px; font-weight: 600; }
  .stat-label { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.8px; }
  .add-car-btn { background: var(--surface); border: 2px dashed var(--border); border-radius: 20px; padding: 24px; display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; transition: all 0.2s; width: 100%; margin-bottom: 14px; }
  .add-car-btn:hover { border-color: var(--accent); }
  .add-car-btn .icon { width: 40px; height: 40px; background: var(--surface2); border-radius: 12px; display: flex; align-items: center; justify-content: center; }
  .add-car-btn > span { font-size: 13px; color: var(--muted); }
  .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; margin-top: 4px; }
  .section-title { font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: var(--muted); font-weight: 600; }
  .section-action { font-size: 12px; color: var(--accent); cursor: pointer; font-weight: 500; }

  .timeline { display: flex; flex-direction: column; }
  .timeline-item { display: flex; gap: 14px; padding: 14px 0; cursor: pointer; }
  .timeline-item:hover .timeline-title { color: var(--accent); }
  .timeline-item + .timeline-item { border-top: 1px solid var(--border); }
  .timeline-dot { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 16px; margin-top: 2px; }
  .dot-maintenance { background: rgba(200,245,58,0.12); }
  .dot-fuel { background: rgba(245,88,58,0.12); }
  .dot-tire { background: rgba(245,184,58,0.12); }
  .dot-oil { background: rgba(88,180,245,0.12); }
  .dot-review { background: rgba(200,245,58,0.12); }
  .timeline-content { flex: 1; min-width: 0; }
  .timeline-title { font-size: 14px; font-weight: 500; margin-bottom: 2px; transition: color 0.15s; }
  .timeline-meta { font-size: 11px; color: var(--muted); display: flex; gap: 8px; flex-wrap: wrap; }
  .timeline-cost { font-size: 13px; font-weight: 600; color: var(--accent); flex-shrink: 0; }
  .receipt-thumb { width: 32px; height: 32px; border-radius: 8px; object-fit: cover; border: 1px solid var(--border); flex-shrink: 0; margin-top: 2px; }
  .receipt-indicator { display: inline-flex; align-items: center; gap: 3px; font-size: 10px; color: var(--accent); background: rgba(200,245,58,0.1); padding: 2px 6px; border-radius: 10px; margin-top: 4px; }

  .alert-card { background: rgba(245,184,58,0.08); border: 1px solid rgba(245,184,58,0.25); border-radius: 16px; padding: 14px 16px; margin-bottom: 10px; display: flex; gap: 12px; align-items: flex-start; }
  .alert-title { font-size: 13px; font-weight: 600; color: var(--warning); margin-bottom: 2px; }
  .alert-desc { font-size: 12px; color: var(--muted); }

  .quick-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
  .quick-btn { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 16px; display: flex; flex-direction: column; gap: 8px; cursor: pointer; transition: all 0.2s; }
  .quick-btn:hover { border-color: var(--accent); }
  .quick-btn .qb-icon { font-size: 22px; }
  .quick-btn .qb-label { font-size: 13px; font-weight: 500; }
  .quick-btn .qb-sub { font-size: 11px; color: var(--muted); }

  .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); z-index: 200; display: flex; align-items: flex-end; justify-content: center; animation: fadeIn 0.2s; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .sheet { background: var(--surface); border-radius: 24px 24px 0 0; padding: 20px 20px 40px; width: 100%; max-width: 480px; max-height: 92vh; overflow-y: auto; animation: slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1); }
  @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
  .sheet-handle { width: 40px; height: 4px; background: var(--border); border-radius: 2px; margin: 0 auto 20px; }
  .sheet-title { font-family: 'DM Serif Display', serif; font-size: 22px; margin-bottom: 20px; }
  .form-group { margin-bottom: 14px; }
  .form-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--muted); margin-bottom: 6px; display: block; font-weight: 600; }
  .form-input { width: 100%; background: var(--surface2); border: 1px solid var(--border); border-radius: 12px; padding: 12px 14px; color: var(--text); font-family: 'DM Sans', sans-serif; font-size: 14px; outline: none; transition: border 0.2s; }
  .form-input:focus { border-color: var(--accent); }
  .form-select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237a8a72' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .btn-primary { width: 100%; background: var(--accent); color: var(--bg); border: none; border-radius: 14px; padding: 14px; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.2s; margin-top: 8px; }
  .btn-primary:hover { background: var(--accent2); }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-secondary { width: 100%; background: transparent; color: var(--muted); border: 1px solid var(--border); border-radius: 14px; padding: 13px; font-family: 'DM Sans', sans-serif; font-size: 14px; cursor: pointer; margin-top: 8px; }

  .receipt-upload { border: 2px dashed var(--border); border-radius: 14px; padding: 16px; display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; transition: all 0.2s; background: var(--surface2); position: relative; }
  .receipt-upload:hover { border-color: var(--accent); }
  .receipt-upload.has-image { border-style: solid; border-color: var(--accent); padding: 6px; }
  .receipt-upload .ru-icon { font-size: 24px; }
  .receipt-upload .ru-label { font-size: 12px; color: var(--muted); text-align: center; line-height: 1.4; }
  .receipt-upload .ru-sub { font-size: 10px; color: var(--muted); opacity: 0.6; }
  .receipt-preview { width: 100%; border-radius: 10px; max-height: 160px; object-fit: cover; display: block; }
  .receipt-remove { position: absolute; top: 8px; right: 8px; width: 24px; height: 24px; background: var(--danger); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; cursor: pointer; color: white; border: none; }

  .record-detail-img { width: 100%; border-radius: 14px; margin-bottom: 14px; max-height: 220px; object-fit: cover; }
  .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border); font-size: 13px; }
  .detail-row:last-child { border-bottom: none; }
  .detail-row span:first-child { color: var(--muted); }
  .detail-row span:last-child { font-weight: 500; text-align: right; max-width: 60%; }
  .transfer-card { background: linear-gradient(135deg, rgba(200,245,58,0.1), rgba(200,245,58,0.03)); border: 1px solid rgba(200,245,58,0.3); border-radius: 20px; padding: 20px; margin-bottom: 14px; }
  .transfer-btn { margin-top: 14px; background: var(--accent); color: var(--bg); border: none; border-radius: 12px; padding: 10px 20px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; }

  .photos-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 16px; }
  .photo-slot { aspect-ratio: 1; border-radius: 12px; overflow: hidden; background: var(--surface2); border: 1px dashed var(--border); display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; gap: 4px; transition: border 0.2s; }
  .photo-slot:hover { border-color: var(--accent); }
  .photo-slot > span:first-child { font-size: 24px; }
  .photo-slot > span:last-child { font-size: 9px; color: var(--muted); text-align: center; padding: 0 4px; }
  .photo-slot img { width: 100%; height: 100%; object-fit: cover; }

  .manual-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 16px; margin-bottom: 10px; display: flex; gap: 12px; align-items: center; cursor: pointer; transition: all 0.2s; }
  .manual-card:hover { border-color: var(--accent); }
  .manual-icon { width: 40px; height: 40px; background: var(--surface2); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
  .mc-title { font-size: 14px; font-weight: 500; margin-bottom: 2px; }
  .mc-sub { font-size: 12px; color: var(--muted); }

  .back-btn { display: flex; align-items: center; gap: 6px; color: var(--muted); font-size: 13px; cursor: pointer; margin-bottom: 16px; }
  .detail-km-bar { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 16px; margin-bottom: 14px; }
  .km-display { font-family: 'DM Serif Display', serif; font-size: 36px; line-height: 1; margin-bottom: 4px; }
  .km-display span { font-size: 16px; color: var(--muted); font-family: 'DM Sans', sans-serif; }
  .km-progress { height: 4px; background: var(--surface2); border-radius: 2px; overflow: hidden; margin-top: 12px; }
  .km-progress-fill { height: 100%; background: linear-gradient(90deg, var(--accent), var(--accent2)); border-radius: 2px; transition: width 0.8s cubic-bezier(0.34,1.56,0.64,1); }
  .chips { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px; }
  .chip { padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; border: 1px solid var(--border); background: var(--surface2); cursor: pointer; transition: all 0.15s; }
  .chip.selected { background: var(--accent); color: var(--bg); border-color: var(--accent); }
  .tag { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 600; }
  .tag-green { background: rgba(200,245,58,0.12); color: var(--accent); }
  .toast { position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%); background: var(--accent); color: var(--bg); padding: 10px 20px; border-radius: 100px; font-size: 13px; font-weight: 600; z-index: 999; animation: fadeIn 0.2s; white-space: nowrap; }
  ::-webkit-scrollbar { width: 0; }
`

const VEHICLE_TYPES = [
  { key: "car",     emoji: "🚗", label: "Carro",    fipeCode: 1 },
  { key: "moto",    emoji: "🏍️", label: "Moto",     fipeCode: 2 },
  { key: "truck",   emoji: "🚛", label: "Caminhão", fipeCode: 3 },
  { key: "van",     emoji: "🚐", label: "Van",      fipeCode: 1 },
  { key: "pickup",  emoji: "🛻", label: "Pickup",   fipeCode: 1 },
  { key: "bus",     emoji: "🚌", label: "Ônibus",   fipeCode: 3 },
  { key: "tractor", emoji: "🚜", label: "Trator",   fipeCode: 3 },
  { key: "other",   emoji: "🚙", label: "Outro",    fipeCode: 1 },
]

const PHOTO_ANGLES = [
  { key: "front",    label: "Frente"     },
  { key: "rear",     label: "Traseira"   },
  { key: "left",     label: "Lateral E." },
  { key: "right",    label: "Lateral D." },
  { key: "interior", label: "Interior"   },
  { key: "odometer", label: "Hodômetro"  },
]

const TYPE_CONFIG = {
  oil:         { emoji: "🛢️", label: "Óleo",          cls: "dot-oil"         },
  tire:        { emoji: "🔧", label: "Pneu/Roda",     cls: "dot-tire"        },
  maintenance: { emoji: "⚙️", label: "Revisão",       cls: "dot-review"      },
  fuel:        { emoji: "⛽", label: "Abastecimento", cls: "dot-fuel"        },
  part:        { emoji: "🔩", label: "Peça",          cls: "dot-maintenance" },
  wash:        { emoji: "🚿", label: "Lavagem",       cls: "dot-maintenance" },
  brake:       { emoji: "🛑", label: "Freios",        cls: "dot-tire"        },
  electric:    { emoji: "⚡", label: "Elétrico",      cls: "dot-oil"         },
  other:       { emoji: "📝", label: "Outro",         cls: "dot-maintenance" },
}

const FIPE_BASE = "https://parallelum.com.br/fipe/api/v1"
const getTypeInfo = (k) => VEHICLE_TYPES.find(t => t.key === k) || VEHICLE_TYPES[0]

function useFipe(fipeCode) {
  const [brands, setBrands]   = useState([])
  const [models, setModels]   = useState([])
  const [years,  setYears]    = useState([])
  const [brandId, setBrandId] = useState("")
  const [modelId, setModelId] = useState("")
  const [yearId,  setYearId]  = useState("")
  const [price,   setPrice]   = useState(null)
  const [loading, setLoading] = useState("")
  const [error,   setError]   = useState("")
  const slug = fipeCode === 2 ? "motos" : fipeCode === 3 ? "caminhoes" : "carros"

  useEffect(() => {
    setLoading("marcas"); setBrands([]); setModels([]); setYears([])
    setBrandId(""); setModelId(""); setYearId(""); setPrice(null); setError("")
    fetch(`${FIPE_BASE}/${slug}/marcas`)
      .then(r => r.json()).then(d => { setBrands(d); setLoading("") })
      .catch(() => { setError("Erro ao carregar marcas"); setLoading("") })
  }, [slug])

  const selectBrand = useCallback((id) => {
    setBrandId(id); setModels([]); setYears([]); setModelId(""); setYearId(""); setPrice(null)
    if (!id) return
    setLoading("modelos")
    fetch(`${FIPE_BASE}/${slug}/marcas/${id}/modelos`)
      .then(r => r.json()).then(d => { setModels(d.modelos || []); setLoading("") })
      .catch(() => { setError("Erro"); setLoading("") })
  }, [slug])

  const selectModel = useCallback((id) => {
    setModelId(id); setYears([]); setYearId(""); setPrice(null)
    if (!id) return
    setLoading("anos")
    fetch(`${FIPE_BASE}/${slug}/marcas/${brandId}/modelos/${id}/anos`)
      .then(r => r.json()).then(d => { setYears(d); setLoading("") })
      .catch(() => { setError("Erro"); setLoading("") })
  }, [slug, brandId])

  const selectYear = useCallback((id) => {
    setYearId(id); setPrice(null)
    if (!id) return
    setLoading("preço")
    fetch(`${FIPE_BASE}/${slug}/marcas/${brandId}/modelos/${modelId}/anos/${id}`)
      .then(r => r.json()).then(d => { setPrice(d); setLoading("") })
      .catch(() => { setError("Erro"); setLoading("") })
  }, [slug, brandId, modelId])

  return { brands, models, years, brandId, modelId, yearId, price, loading, error, selectBrand, selectModel, selectYear }
}

// ── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!isConfigured || !supabase) { setChecking(false); return }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session); setChecking(false)
    }).catch(() => setChecking(false))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  if (checking) return (
    <>
      <style>{FONTS}{STYLES}</style>
      <div style={{ minHeight: "100vh", background: "#0d0f0e", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: "#eef2e6" }}>Fleet<span style={{ color: "#c8f53a" }}>Log</span></div>
        <span className="spin" style={{ fontSize: 24, color: "#c8f53a" }}>⟳</span>
      </div>
    </>
  )

  if (!isConfigured) return (
    <>
      <style>{FONTS}{STYLES}</style>
      <div style={{ minHeight: "100vh", background: "#0d0f0e", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: "#eef2e6", marginBottom: 24 }}>Fleet<span style={{ color: "#c8f53a" }}>Log</span></div>
        <div className="config-warn">
          <h2>⚙️ Configuração necessária</h2>
          <p>As variáveis do Supabase não estão configuradas.<br/>Adicione no Netlify:<br/><br/>
          <code>REACT_APP_SUPABASE_URL</code><br/><code>REACT_APP_SUPABASE_ANON_KEY</code><br/><br/>
          Depois gere um novo build e faça o deploy novamente.</p>
        </div>
      </div>
    </>
  )

  if (!session) return <><style>{FONTS}</style><AuthScreen /></>
  return <FleetApp session={session} />
}

// ── FLEET APP ─────────────────────────────────────────────────────────────────
function FleetApp({ session }) {
  const user = session.user
  const initials = (user.user_metadata?.full_name || user.email || "U").slice(0, 2).toUpperCase()

  const [tab, setTab]               = useState("home")
  const [vehicles, setVehicles]     = useState([])
  const [records, setRecords]       = useState({})
  const [selectedId, setSelectedId] = useState(null)
  const [loading, setLoading]       = useState(true)
  const [modal, setModal]           = useState(null)
  const [newKm, setNewKm]           = useState("")
  const [recordType, setRecordType] = useState("maintenance")
  const [formData, setFormData]     = useState({})
  const [vehicleType, setVehicleType] = useState("car")
  const [viewRecord, setViewRecord] = useState(null)
  const [editRecord, setEditRecord]   = useState(null)
  const [receiptFile, setReceiptFile] = useState(null)
  const [receiptPreview, setReceiptPreview] = useState(null)
  const [saving, setSaving]         = useState(false)
  const [toast, setToast]           = useState(null)
  const [photoAngle, setPhotoAngle] = useState(null)

  const photoInputRef   = useRef(null)
  const receiptInputRef = useRef(null)

  const activeVtype   = VEHICLE_TYPES.find(t => t.key === vehicleType) || VEHICLE_TYPES[0]
  const fipe          = useFipe(activeVtype.fipeCode)
  const activeVehicle = selectedId ? vehicles.find(v => v.id === selectedId) : null
  const activeRecords = selectedId ? (records[selectedId] || []) : []

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500) }

  useEffect(() => {
    fetchVehicles(user.id)
      .then(async data => {
        setVehicles(data || [])
        setLoading(false)
        // Load records for ALL vehicles so home counter works
        const allRecords = {}
        await Promise.all((data || []).map(v =>
          fetchRecords(v.id).then(recs => { allRecords[v.id] = recs || [] }).catch(() => {})
        ))
        setRecords(allRecords)
      })
      .catch(() => setLoading(false))
  }, [user.id])

  useEffect(() => {
    if (!selectedId || records[selectedId]) return
    fetchRecords(selectedId).then(data => setRecords(r => ({ ...r, [selectedId]: data || [] })))
  }, [selectedId, records])

  const handleLogout = async () => { await supabase.auth.signOut() }

  const updateKm = async () => {
    if (!newKm || !activeVehicle) return
    const km = parseInt(newKm)
    if (km <= activeVehicle.km) { showToast("KM deve ser maior que o atual"); return }
    setSaving(true)
    try {
      const updated = await updateVehicle(activeVehicle.id, { km })
      setVehicles(p => p.map(v => v.id === updated.id ? updated : v))
      setNewKm(""); setModal(null); showToast("KM atualizado ✓")
    } catch { showToast("Erro ao salvar") } finally { setSaving(false) }
  }

  const addVehicle = async () => {
    const name = fipe.price ? `${fipe.price.Marca} ${fipe.price.Modelo}` : formData.name
    if (!name) return
    setSaving(true)
    try {
      const payload = {
        type: vehicleType, name,
        year: fipe.price ? String(fipe.price.AnoModelo) : (formData.year || ""),
        plate: formData.plate || "", color: formData.color || "",
        fuel: fipe.price ? fipe.price.Combustivel : (formData.fuel || "Flex"),
        km: parseInt(formData.km) || 0,
        next_service: (parseInt(formData.km) || 0) + 10000,
        fipe_price: fipe.price ? fipe.price.Valor : null,
        fipe_ref: fipe.price ? fipe.price.MesReferencia : null,
        fipe_code: fipe.price ? fipe.price.CodigoFipe : null,
        photos: {},
      }
      const created = await insertVehicle(user.id, payload)
      setVehicles(p => [created, ...p])
      setFormData({}); setModal(null); showToast("Veículo adicionado ✓")
    } catch { showToast("Erro ao salvar veículo") } finally { setSaving(false) }
  }

  const saveRecord = async () => {
    if (!formData.title || !activeVehicle) return
    setSaving(true)
    try {
      // Upload receipt if new file selected
      let receiptUrl = editRecord ? editRecord.receipt_url : null
      if (receiptFile) {
        receiptUrl = await uploadReceipt(user.id, activeVehicle.id, receiptFile)
      }

      const payload = {
        type: recordType,
        title: formData.title,
        date: formData.date || new Date().toISOString().slice(0, 10),
        km: parseInt(formData.km) || activeVehicle.km,
        cost: parseFloat(formData.cost) || 0,
        notes: formData.notes || "",
        parts: formData.parts || "",
        receipt_url: receiptUrl,
      }

      if (editRecord) {
        // EDITING existing record
        const updated = await updateRecord(editRecord.id, payload)
        setRecords(r => ({
          ...r,
          [activeVehicle.id]: (r[activeVehicle.id] || []).map(rec => rec.id === updated.id ? updated : rec)
        }))
        setEditRecord(null)
        showToast("Registro atualizado ✓")
      } else {
        // NEW record
        const created = await insertRecord(activeVehicle.id, payload)
        setRecords(r => ({ ...r, [activeVehicle.id]: [created, ...(r[activeVehicle.id] || [])] }))
        showToast("Registro adicionado ✓")
      }

      setFormData({}); setReceiptFile(null); setReceiptPreview(null); setModal(null)
    } catch (e) {
      console.error(e)
      showToast("Erro ao salvar registro")
    } finally { setSaving(false) }
  }

  const handlePhotoCapture = async (e, vehicleId, angle) => {
    const file = e.target.files[0]; if (!file) return
    const preview = URL.createObjectURL(file)
    // Optimistic preview
    setVehicles(p => p.map(v => v.id === vehicleId ? { ...v, photos: { ...(v.photos || {}), [angle]: preview } } : v))
    try {
      // Upload file to storage
      const url = await uploadPhoto(user.id, vehicleId, angle, file)
      // Fetch the LATEST vehicle data from DB to get all existing photos (avoids overwriting)
      const { data: freshVehicle } = await supabase.from('vehicles').select('photos').eq('id', vehicleId).single()
      const existingPhotos = freshVehicle?.photos || {}
      const newPhotos = { ...existingPhotos, [angle]: url }
      const updated = await updateVehicle(vehicleId, { photos: newPhotos })
      setVehicles(p => p.map(v => v.id === updated.id ? updated : v))
      showToast("Foto salva ✓")
    } catch (err) {
      console.error(err)
      showToast("Erro ao enviar foto")
    }
  }

  const handleTransfer = async () => {
    if (!formData.email || !activeVehicle) return
    setSaving(true)
    try {
      const transfer = await createTransfer(activeVehicle.id, user.id, formData.email)
      const link = `${window.location.origin}?transfer=${transfer.token}`
      await navigator.clipboard.writeText(link).catch(() => {})
      showToast("Link copiado! Envie ao novo dono ✓")
      setModal(null); setFormData({})
    } catch { showToast("Erro ao criar transferência") } finally { setSaving(false) }
  }

  const handleReceiptSelect = (e) => {
    const file = e.target.files[0]; if (!file) return
    setReceiptFile(file); setReceiptPreview(URL.createObjectURL(file))
  }

  if (loading) return (
    <>
      <style>{FONTS}{STYLES}</style>
      <div style={{ minHeight: "100vh", background: "#0d0f0e", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: "#eef2e6" }}>Fleet<span style={{ color: "#c8f53a" }}>Log</span></div>
        <span className="spin" style={{ fontSize: 24, color: "#c8f53a" }}>⟳</span>
      </div>
    </>
  )

  const HomeTab = () => (
    <div>
      <div className="greeting">
        <p>Bem-vindo, {user.user_metadata?.full_name?.split(" ")[0] || "usuário"}</p>
        <h1 className="serif">Minha Frota</h1>
      </div>
      {vehicles.map(v => {
        const ti = getTypeInfo(v.type)
        const prog = Math.min(((v.km||0) / (v.next_service||1)) * 100, 100)
        const vRecords = records[v.id] || []
        return (
          <div key={v.id} className={`car-card ${selectedId === v.id ? "active-card" : ""}`}
            onClick={() => { setSelectedId(v.id); setTab("detail") }}>
            <div className="car-visual">
              {v.photos?.front ? <img src={v.photos.front} alt={v.name} className="car-photo-img" /> : <span className="car-emoji">{ti.emoji}</span>}
              <span className="vtype-tag">{ti.label}</span>
              <span className="car-badge">{v.plate || "Sem placa"}</span>
              {v.fipe_price && <span className="fipe-chip">FIPE {v.fipe_price}</span>}
            </div>
            <div className="car-info">
              <div className="car-name serif">{v.name}</div>
              <div className="car-sub"><span>🗓 {v.year}</span><span>⛽ {v.fuel}</span><span>🎨 {v.color}</span></div>
            </div>
            <div className="car-stats">
              <div className="stat"><div className="stat-val">{(v.km||0).toLocaleString("pt-BR")}</div><div className="stat-label">Km atual</div></div>
              <div className="stat"><div className="stat-val">{vRecords.length}</div><div className="stat-label">Registros</div></div>
              <div className="stat"><div className="stat-val">{((v.next_service||0)-(v.km||0)).toLocaleString("pt-BR")}</div><div className="stat-label">Km próx. rev.</div></div>
            </div>
            <div style={{ padding: "0 16px 14px" }}>
              <div className="km-progress"><div className="km-progress-fill" style={{ width: `${prog}%` }} /></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <span style={{ fontSize: 10, color: "var(--muted)" }}>Até próxima revisão</span>
                <span style={{ fontSize: 10, color: prog > 85 ? "var(--warning)" : "var(--muted)" }}>{Math.round(prog)}%</span>
              </div>
            </div>
          </div>
        )
      })}
      <button className="add-car-btn" onClick={() => { setFormData({}); setVehicleType("car"); setModal("addVehicle") }}>
        <div className="icon"><span style={{ fontSize: 20 }}>➕</span></div>
        <span>Adicionar veículo</span>
      </button>
      <div className="section-header"><span className="section-title">Alertas</span></div>
      {vehicles.filter(v => ((v.next_service||0)-(v.km||0)) < 3000).map(v => (
        <div className="alert-card" key={v.id}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <div><div className="alert-title">Revisão próxima — {v.name}</div><div className="alert-desc">Faltam {((v.next_service||0)-(v.km||0)).toLocaleString("pt-BR")} km.</div></div>
        </div>
      ))}
      {vehicles.length === 0 && <div style={{ textAlign: "center", padding: "32px", color: "var(--muted)", fontSize: 13 }}><div style={{ fontSize: 40, marginBottom: 12 }}>🚗</div>Nenhum veículo ainda.<br/>Adicione o primeiro!</div>}
    </div>
  )

  const DetailTab = () => {
    if (!activeVehicle) return <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)" }}><div style={{ fontSize: 40, marginBottom: 12 }}>🚗</div><p>Selecione um veículo na aba Início</p></div>
    const ti = getTypeInfo(activeVehicle.type)
    const totalSpent = activeRecords.reduce((s, r) => s + (r.cost || 0), 0)
    const prog = Math.min(((activeVehicle.km||0) / (activeVehicle.next_service||1)) * 100, 100)
    const receiptsCount = activeRecords.filter(r => r.receipt_url).length
    return (
      <div>
        <div className="back-btn" onClick={() => { setSelectedId(null); setTab("home") }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>Voltar
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
              <span className="tag tag-green">{ti.label}</span>
              <span className="tag tag-green">{activeVehicle.plate}</span>
              <span className="tag tag-green">{activeVehicle.year}</span>
            </div>
            <h2 className="serif" style={{ fontSize: 26 }}>{activeVehicle.name}</h2>
          </div>
          <span style={{ fontSize: 56 }}>{ti.emoji}</span>
        </div>
        {activeVehicle.fipe_price && (
          <div className="fipe-value-card">
            <div><div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "var(--muted)", marginBottom: 2 }}>💰 Valor FIPE</div><div style={{ fontFamily: "DM Serif Display, serif", fontSize: 24, color: "var(--accent)" }}>{activeVehicle.fipe_price}</div>{activeVehicle.fipe_ref && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>Ref: {activeVehicle.fipe_ref}</div>}</div>
            <div style={{ fontSize: 28 }}>📊</div>
          </div>
        )}
        <div className="detail-km-bar">
          <div style={{ color: "var(--muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Quilometragem</div>
          <div className="km-display">{(activeVehicle.km||0).toLocaleString("pt-BR")} <span>km</span></div>
          <div className="km-progress" style={{ marginTop: 8 }}><div className="km-progress-fill" style={{ width: `${prog}%` }} /></div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>Próx. revisão: {(activeVehicle.next_service||0).toLocaleString("pt-BR")} km</span>
            <button onClick={() => setModal("km")} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 12, cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}>Atualizar</button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
          {[{ label: "Total gasto", val: `R$\u00a0${totalSpent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` }, { label: "Registros", val: activeRecords.length }, { label: "NFs", val: receiptsCount }].map(s => (
            <div key={s.label} className="detail-km-bar" style={{ marginBottom: 0, padding: "12px 14px" }}>
              <div style={{ color: "var(--muted)", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 18, lineHeight: 1.2 }}>{s.val}</div>
            </div>
          ))}
        </div>
        <div className="quick-actions">
          {[{ type: "oil", icon: "🛢️", label: "Óleo", sub: "Troca de óleo" }, { type: "maintenance", icon: "⚙️", label: "Revisão", sub: "Manutenção geral" }, { type: "tire", icon: "🔧", label: "Pneu/Roda", sub: "Alinhamento, etc" }, { type: "fuel", icon: "⛽", label: "Abastec.", sub: "Combustível" }].map(a => (
            <button key={a.type} className="quick-btn" onClick={() => { setFormData({}); setEditRecord(null); setReceiptFile(null); setReceiptPreview(null); setRecordType(a.type); setModal("addRecord") }}>
              <span className="qb-icon">{a.icon}</span><span className="qb-label">{a.label}</span><span className="qb-sub">{a.sub}</span>
            </button>
          ))}
        </div>
        <div className="transfer-card">
          <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
          <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 18, marginBottom: 6 }}>Documento do Veículo</div>
          <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>Transfira o histórico completo para o novo dono. Ele recebe um link e ao criar conta, tudo aparece automaticamente.</div>
          <button className="transfer-btn" onClick={() => { setFormData({}); setModal("transfer") }}>Transferir histórico</button>
        </div>
        <div className="section-header" style={{ marginTop: 8 }}>
          <span className="section-title">Histórico</span>
          <span className="section-action" onClick={() => { setFormData({}); setEditRecord(null); setReceiptFile(null); setReceiptPreview(null); setModal("addRecord") }}>+ Novo</span>
        </div>
        <div className="timeline">
          {activeRecords.map(rec => {
            const tc = TYPE_CONFIG[rec.type] || TYPE_CONFIG.other
            return (
              <div className="timeline-item" key={rec.id} onClick={() => setViewRecord(rec)}>
                <div className={`timeline-dot ${tc.cls}`}>{tc.emoji}</div>
                <div className="timeline-content">
                  <div className="timeline-title">{rec.title}</div>
                  <div className="timeline-meta"><span>{rec.date}</span><span>•</span><span>{(rec.km||0).toLocaleString("pt-BR")} km</span>{rec.parts && <><span>•</span><span style={{ color: "var(--accent)", fontSize: 10 }}>🔩 peças</span></>}</div>
                  {rec.receipt_url && <div className="receipt-indicator">🧾 Nota fiscal</div>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  {rec.cost > 0 && <div className="timeline-cost">R${(rec.cost).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>}
                  {rec.receipt_url && <img src={rec.receipt_url} alt="NF" className="receipt-thumb" />}
                  <button onClick={e => { e.stopPropagation(); setEditRecord(rec); setRecordType(rec.type); setFormData({ title: rec.title, date: rec.date, km: rec.km, cost: rec.cost, notes: rec.notes, parts: rec.parts }); setReceiptPreview(rec.receipt_url || null); setReceiptFile(null); setModal("addRecord") }} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "3px 8px", fontSize: 10, color: "var(--muted)", cursor: "pointer", marginTop: 2 }}>✏️ editar</button>
                </div>
              </div>
            )
          })}
          {activeRecords.length === 0 && <div style={{ textAlign: "center", padding: "24px", color: "var(--muted)", fontSize: 13 }}>Nenhum registro ainda.<br/>Adicione sua primeira manutenção.</div>}
        </div>
      </div>
    )
  }

  const PhotosTab = () => {
    if (!activeVehicle) return <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)" }}><div style={{ fontSize: 40, marginBottom: 12 }}>📸</div><p>Selecione um veículo primeiro</p></div>
    return (
      <div>
        <div className="greeting"><p>{getTypeInfo(activeVehicle.type).label} · {activeVehicle.name}</p><h1 className="serif">Fotos do Veículo</h1></div>
        <div style={{ background: "rgba(200,245,58,0.06)", border: "1px solid rgba(200,245,58,0.15)", borderRadius: 14, padding: "12px 14px", marginBottom: 16, fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>📸 Fotos salvas na nuvem — aparecem para o novo dono na transferência.</div>
        <div className="photos-grid">
          {PHOTO_ANGLES.map(angle => (
            <div key={angle.key} className="photo-slot" onClick={() => { setPhotoAngle(angle.key); photoInputRef.current && photoInputRef.current.click() }}>
              {activeVehicle.photos?.[angle.key] ? <img src={activeVehicle.photos[angle.key]} alt={angle.label} /> : <><span>📷</span><span>{angle.label}</span></>}
            </div>
          ))}
        </div>
        <input ref={photoInputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={(e) => handlePhotoCapture(e, activeVehicle.id, photoAngle)} />
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "14px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: "var(--muted)" }}>Fotos registradas</span>
            <span style={{ color: "var(--accent)" }}>{Object.keys(activeVehicle.photos || {}).length} / {PHOTO_ANGLES.length}</span>
          </div>
        </div>
      </div>
    )
  }

  const ManualTab = () => (
    <div>
      <div className="greeting"><p>Informações técnicas</p><h1 className="serif">Manual</h1></div>
      {activeVehicle && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "16px", marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Veículo selecionado</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 32 }}>{getTypeInfo(activeVehicle.type).emoji}</span>
            <div>
              <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 20 }}>{activeVehicle.name}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{activeVehicle.year} · {activeVehicle.fuel}</div>
              {activeVehicle.fipe_code && <div style={{ fontSize: 11, color: "var(--accent)", marginTop: 4 }}>Cód. FIPE: {activeVehicle.fipe_code}</div>}
            </div>
          </div>
        </div>
      )}
      {[{ icon: "📖", title: "Manual do Proprietário", sub: "Guia completo do veículo" }, { icon: "🔧", title: "Tabela de Revisões", sub: "Intervalos recomendados pela montadora" }, { icon: "⛽", title: "Especificações de Combustível", sub: "Tipo e octanagem recomendados" }, { icon: "🛢️", title: "Especificações de Óleo", sub: "Viscosidade e volume" }, { icon: "💨", title: "Calibragem dos Pneus", sub: "Pressão dianteira e traseira" }, { icon: "⚡", title: "Sistema Elétrico", sub: "Fusíveis e bateria" }].map((item, i) => (
        <div className="manual-card" key={i}>
          <div className="manual-icon">{item.icon}</div>
          <div><div className="mc-title">{item.title}</div><div className="mc-sub">{item.sub}</div></div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" style={{ marginLeft: "auto", flexShrink: 0 }}><path d="M9 18l6-6-6-6"/></svg>
        </div>
      ))}
    </div>
  )

  const FipeSection = () => (
    <div className="fipe-box">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)" }}>🔍 Busca automática FIPE</span>
        {fipe.loading && <span className="fipe-loading"><span className="spin">⟳</span> {fipe.loading}…</span>}
      </div>
      <div className="form-group" style={{ marginBottom: 8 }}>
        <label className="form-label">Marca</label>
        <select className="form-input form-select" value={fipe.brandId} onChange={e => fipe.selectBrand(e.target.value)}>
          <option value="">Selecione a marca</option>
          {fipe.brands.map(b => <option key={b.codigo} value={b.codigo}>{b.nome}</option>)}
        </select>
      </div>
      {fipe.brandId && <div className="form-group" style={{ marginBottom: 8 }}>
        <label className="form-label">Modelo</label>
        <select className="form-input form-select" value={fipe.modelId} onChange={e => fipe.selectModel(e.target.value)}>
          <option value="">Selecione o modelo</option>
          {fipe.models.map(m => <option key={m.codigo} value={m.codigo}>{m.nome}</option>)}
        </select>
      </div>}
      {fipe.modelId && <div className="form-group" style={{ marginBottom: 8 }}>
        <label className="form-label">Ano / Combustível</label>
        <select className="form-input form-select" value={fipe.yearId} onChange={e => fipe.selectYear(e.target.value)}>
          <option value="">Selecione o ano</option>
          {fipe.years.map(y => <option key={y.codigo} value={y.codigo}>{y.nome}</option>)}
        </select>
      </div>}
      {fipe.error && <div className="fipe-error">⚠️ {fipe.error}</div>}
      {fipe.price && <div className="fipe-badge"><span className="fb-label">Valor FIPE — {fipe.price.MesReferencia}</span><span className="fb-val">{fipe.price.Valor}</span><span className="fb-ref">{fipe.price.Marca} {fipe.price.Modelo} · {fipe.price.AnoModelo} · {fipe.price.Combustivel}</span></div>}
      {fipe.price && <div style={{ marginTop: 10, fontSize: 12, color: "var(--muted)" }}>✓ Nome, ano e combustível preenchidos automaticamente</div>}
    </div>
  )

  return (
    <>
      <style>{FONTS}{STYLES}</style>
      <div className="app">
        <div className="header">
          <div className="logo">Fleet<span>Log</span></div>
          <div className="user-menu">
            <div className="user-badge">{initials}</div>
            <button className="logout-btn" onClick={handleLogout}>Sair</button>
          </div>
        </div>
        <div className="main">
          {tab === "home"   && <HomeTab />}
          {tab === "detail" && <DetailTab />}
          {tab === "photos" && <PhotosTab />}
          {tab === "manual" && <ManualTab />}
        </div>
        <nav className="bottom-nav">
          {[
            { id: "home",   label: "Início",  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg> },
            { id: "detail", label: "Veículo", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg> },
            { id: "photos", label: "Fotos",   icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg> },
            { id: "manual", label: "Manual",  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg> },
          ].map(n => (
            <div key={n.id} className={`nav-item ${tab === n.id ? "active" : ""}`} onClick={() => setTab(n.id)}>
              {n.icon}<span>{n.label}</span>
            </div>
          ))}
        </nav>

        {modal === "addVehicle" && (
          <div className="overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
            <div className="sheet">
              <div className="sheet-handle" />
              <div className="sheet-title serif">Novo Veículo</div>
              <div className="form-group">
                <label className="form-label">Tipo de veículo</label>
                <div className="vtype-grid">
                  {VEHICLE_TYPES.map(t => (
                    <div key={t.key} className={`vtype-btn ${vehicleType === t.key ? "selected" : ""}`} onClick={() => setVehicleType(t.key)}>
                      <span className="vt-emoji">{t.emoji}</span><span className="vt-label">{t.label.split("/")[0]}</span>
                    </div>
                  ))}
                </div>
              </div>
              <FipeSection />
              {!fipe.price && <>
                <div style={{ textAlign: "center", fontSize: 12, color: "var(--muted)", margin: "4px 0 12px" }}>— ou preencha manualmente —</div>
                <div className="form-group"><label className="form-label">Modelo *</label><input className="form-input" placeholder="Ex: Honda CB 500F" value={formData.name || ""} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} /></div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Ano</label><input className="form-input" placeholder="2022" value={formData.year || ""} onChange={e => setFormData(p => ({ ...p, year: e.target.value }))} /></div>
                  <div className="form-group"><label className="form-label">Combustível</label><select className="form-input form-select" value={formData.fuel || "Flex"} onChange={e => setFormData(p => ({ ...p, fuel: e.target.value }))}><option>Flex</option><option>Gasolina</option><option>Diesel</option><option>Elétrico</option><option>Híbrido</option><option>GNV</option></select></div>
                </div>
              </>}
              <div className="form-row">
                <div className="form-group"><label className="form-label">Placa</label><input className="form-input" placeholder="ABC-1234" value={formData.plate || ""} onChange={e => setFormData(p => ({ ...p, plate: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Cor</label><input className="form-input" placeholder="Prata" value={formData.color || ""} onChange={e => setFormData(p => ({ ...p, color: e.target.value }))} /></div>
              </div>
              <div className="form-group"><label className="form-label">KM atual</label><input className="form-input" type="number" placeholder="0" value={formData.km || ""} onChange={e => setFormData(p => ({ ...p, km: e.target.value }))} /></div>
              <button className="btn-primary" disabled={saving || (!fipe.price && !formData.name)} onClick={addVehicle}>{saving ? "Salvando…" : fipe.price ? `✓ Adicionar — ${fipe.price.Valor}` : "Adicionar Veículo"}</button>
              <button className="btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
            </div>
          </div>
        )}

        {modal === "addRecord" && (
          <div className="overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
            <div className="sheet">
              <div className="sheet-handle" />
              <div className="sheet-title serif">{editRecord ? "Editar Registro" : "Novo Registro"}</div>
              <div className="form-group"><label className="form-label">Tipo</label><div className="chips">{Object.entries(TYPE_CONFIG).map(([k, v]) => (<div key={k} className={`chip ${recordType === k ? "selected" : ""}`} onClick={() => setRecordType(k)}>{v.emoji} {v.label}</div>))}</div></div>
              <div className="form-group"><label className="form-label">Descrição *</label><input className="form-input" placeholder="Ex: Troca de óleo + filtro" value={formData.title || ""} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} /></div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Data</label><input className="form-input" type="date" value={formData.date || new Date().toISOString().slice(0, 10)} onChange={e => setFormData(p => ({ ...p, date: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">KM no momento</label><input className="form-input" type="number" placeholder={activeVehicle?.km} value={formData.km || ""} onChange={e => setFormData(p => ({ ...p, km: e.target.value }))} /></div>
              </div>
              <div className="form-group"><label className="form-label">Custo (R$)</label><input className="form-input" type="number" step="0.01" placeholder="0,00" value={formData.cost || ""} onChange={e => setFormData(p => ({ ...p, cost: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Peças trocadas</label><input className="form-input" placeholder="Ex: Filtro de óleo, vela de ignição" value={formData.parts || ""} onChange={e => setFormData(p => ({ ...p, parts: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Observações</label><textarea className="form-input" rows={2} style={{ resize: "none" }} placeholder="Notas adicionais..." value={formData.notes || ""} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} /></div>
              <div className="form-group">
                <label className="form-label">🧾 Nota Fiscal / Comprovante</label>
                <div className={`receipt-upload ${receiptPreview ? "has-image" : ""}`} onClick={() => receiptInputRef.current && receiptInputRef.current.click()}>
                  {receiptPreview ? <><img src={receiptPreview} alt="NF" className="receipt-preview" /><button className="receipt-remove" onClick={e => { e.stopPropagation(); setReceiptFile(null); setReceiptPreview(null) }}>✕</button></> : <><span className="ru-icon">🧾</span><span className="ru-label">Tire foto da nota fiscal<br/>ou selecione da galeria</span><span className="ru-sub">Opcional · JPG, PNG</span></>}
                </div>
                <input ref={receiptInputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleReceiptSelect} />
              </div>
              <button className="btn-primary" disabled={saving || !formData.title} onClick={saveRecord}>{saving ? "Salvando…" : editRecord ? "Salvar alterações" : "Salvar Registro"}</button>
              <button className="btn-secondary" onClick={() => { setModal(null); setEditRecord(null); setReceiptPreview(null); setReceiptFile(null) }}>Cancelar</button>
            </div>
          </div>
        )}

        {modal === "km" && (
          <div className="overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
            <div className="sheet">
              <div className="sheet-handle" />
              <div className="sheet-title serif">Atualizar KM</div>
              <div style={{ background: "var(--surface2)", borderRadius: 14, padding: "16px", marginBottom: 16, textAlign: "center" }}>
                <div style={{ color: "var(--muted)", fontSize: 12, marginBottom: 4 }}>KM atual</div>
                <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 32 }}>{(activeVehicle?.km||0).toLocaleString("pt-BR")}</div>
              </div>
              <div className="form-group"><label className="form-label">Novo KM</label><input className="form-input" type="number" placeholder="Digite o novo KM" value={newKm} onChange={e => setNewKm(e.target.value)} style={{ fontSize: 18, textAlign: "center" }} /></div>
              <button className="btn-primary" disabled={saving} onClick={updateKm}>{saving ? "Salvando…" : "Atualizar"}</button>
              <button className="btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
            </div>
          </div>
        )}

        {modal === "transfer" && (
          <div className="overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
            <div className="sheet">
              <div className="sheet-handle" />
              <div className="sheet-title serif">Transferir Histórico</div>
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <div style={{ fontSize: 48, marginBottom: 10 }}>📋</div>
                <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>{getTypeInfo(activeVehicle?.type).emoji} {activeVehicle?.name}</div>
                <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, marginBottom: 16 }}>Um link único será gerado. O novo dono abre, cria uma conta e o veículo aparece automaticamente.</div>
              </div>
              <div className="form-group"><label className="form-label">E-mail do novo proprietário</label><input className="form-input" type="email" placeholder="email@exemplo.com" value={formData.email || ""} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} /></div>
              <div style={{ background: "rgba(200,245,58,0.06)", border: "1px solid rgba(200,245,58,0.15)", borderRadius: 12, padding: "12px 14px", marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.8 }}>✓ {activeRecords.length} registros de manutenção<br/>✓ {activeRecords.filter(r => r.receipt_url).length} notas fiscais<br/>✓ {Object.keys(activeVehicle?.photos || {}).length} fotos do veículo{activeVehicle?.fipe_price && `\n✓ Valor FIPE: ${activeVehicle.fipe_price}`}</div>
              </div>
              <button className="btn-primary" disabled={saving || !formData.email} onClick={handleTransfer}>{saving ? "Gerando link…" : "Gerar link de transferência"}</button>
              <button className="btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
            </div>
          </div>
        )}

        {viewRecord && (
          <div className="overlay" onClick={e => e.target === e.currentTarget && setViewRecord(null)}>
            <div className="sheet">
              <div className="sheet-handle" />
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div className={`timeline-dot ${(TYPE_CONFIG[viewRecord.type]||TYPE_CONFIG.other).cls}`} style={{ width: 40, height: 40 }}>{(TYPE_CONFIG[viewRecord.type]||TYPE_CONFIG.other).emoji}</div>
                <div><div style={{ fontFamily: "DM Serif Display, serif", fontSize: 20 }}>{viewRecord.title}</div><div style={{ fontSize: 12, color: "var(--muted)" }}>{(TYPE_CONFIG[viewRecord.type]||TYPE_CONFIG.other).label}</div></div>
              </div>
              {viewRecord.receipt_url && <div style={{ marginBottom: 14 }}><div className="form-label" style={{ marginBottom: 8 }}>🧾 Nota Fiscal</div><img src={viewRecord.receipt_url} alt="NF" className="record-detail-img" /></div>}
              {[{ label: "Data", val: viewRecord.date }, { label: "KM no momento", val: `${(viewRecord.km||0).toLocaleString("pt-BR")} km` }, { label: "Custo", val: viewRecord.cost > 0 ? `R$ ${viewRecord.cost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—" }, { label: "Peças trocadas", val: viewRecord.parts || "—" }, { label: "Observações", val: viewRecord.notes || "—" }, { label: "Nota fiscal", val: viewRecord.receipt_url ? "✓ Anexada" : "Não anexada" }].map(r => (
                <div className="detail-row" key={r.label}><span>{r.label}</span><span style={{ color: r.label === "Nota fiscal" && viewRecord.receipt_url ? "var(--accent)" : undefined }}>{r.val}</span></div>
              ))}
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button className="btn-secondary" style={{ margin: 0 }} onClick={() => setViewRecord(null)}>Fechar</button>
                <button className="btn-primary" style={{ margin: 0 }} onClick={() => { setEditRecord(viewRecord); setRecordType(viewRecord.type); setFormData({ title: viewRecord.title, date: viewRecord.date, km: viewRecord.km, cost: viewRecord.cost, notes: viewRecord.notes, parts: viewRecord.parts }); setReceiptPreview(viewRecord.receipt_url || null); setReceiptFile(null); setViewRecord(null); setModal("addRecord") }}>✏️ Editar</button>
              </div>
            </div>
          </div>
        )}

        {toast && <div className="toast">{toast}</div>}
      </div>
    </>
  )
}
