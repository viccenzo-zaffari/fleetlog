// db.js — todas as operações com o Supabase centralizadas aqui
import { supabase } from './supabaseClient'

// ── VEHICLES ────────────────────────────────────────────────────────────────
export async function fetchVehicles(userId) {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function insertVehicle(userId, vehicle) {
  const { data, error } = await supabase
    .from('vehicles')
    .insert([{ ...vehicle, user_id: userId }])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateVehicle(id, fields) {
  const { data, error } = await supabase
    .from('vehicles')
    .update(fields)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteVehicle(id) {
  const { error } = await supabase.from('vehicles').delete().eq('id', id)
  if (error) throw error
}

// ── RECORDS ─────────────────────────────────────────────────────────────────
export async function fetchRecords(vehicleId) {
  const { data, error } = await supabase
    .from('records')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('date', { ascending: false })
  if (error) throw error
  return data
}

export async function insertRecord(vehicleId, record) {
  const { data, error } = await supabase
    .from('records')
    .insert([{ ...record, vehicle_id: vehicleId }])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteRecord(id) {
  const { error } = await supabase.from('records').delete().eq('id', id)
  if (error) throw error
}

// ── PHOTOS (Storage) ─────────────────────────────────────────────────────────
export async function uploadPhoto(userId, vehicleId, angleOrContext, file) {
  const ext = file.name.split('.').pop()
  const path = `${userId}/${vehicleId}/${angleOrContext}-${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('vehicle-photos').upload(path, file, { upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from('vehicle-photos').getPublicUrl(path)
  return data.publicUrl
}

export async function uploadReceipt(userId, vehicleId, file) {
  return uploadPhoto(userId, vehicleId, 'receipt', file)
}

// ── TRANSFER ─────────────────────────────────────────────────────────────────
export async function createTransfer(vehicleId, fromUserId, toEmail) {
  const token = Math.random().toString(36).slice(2) + Date.now().toString(36)
  const { data, error } = await supabase
    .from('transfers')
    .insert([{ vehicle_id: vehicleId, from_user_id: fromUserId, to_email: toEmail, token, status: 'pending' }])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function claimTransfer(token, newUserId) {
  const { data: transfer, error } = await supabase
    .from('transfers')
    .select('*')
    .eq('token', token)
    .eq('status', 'pending')
    .single()
  if (error || !transfer) throw new Error('Link de transferência inválido ou já utilizado.')
  await supabase.from('vehicles').update({ user_id: newUserId }).eq('id', transfer.vehicle_id)
  await supabase.from('transfers').update({ status: 'claimed' }).eq('id', transfer.id)
  return transfer.vehicle_id
}
