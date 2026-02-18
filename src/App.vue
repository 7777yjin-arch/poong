<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { crews, roleColor } from './data/crews.js'

// Theme
const isDark = ref(localStorage.getItem('theme') !== 'light')
watch(isDark, (v) => {
  document.documentElement.setAttribute('data-theme', v ? 'dark' : 'light')
  localStorage.setItem('theme', v ? 'dark' : 'light')
}, { immediate: true })

// Custom members from localStorage (per crew)
const customMembers = ref(JSON.parse(localStorage.getItem('customMembers') || '{}'))

function getMembers(crewName) {
  const crew = crews.find(c => c.name === crewName)
  const base = crew ? crew.members : []
  const custom = customMembers.value[crewName] || []
  return [...base, ...custom]
}

function allMembers() {
  const seen = new Set()
  const result = []
  for (const crew of crews) {
    for (const m of getMembers(crew.name)) {
      if (!seen.has(m.id)) {
        seen.add(m.id)
        result.push(m)
      }
    }
  }
  return result
}

function saveCustomMembers() {
  localStorage.setItem('customMembers', JSON.stringify(customMembers.value))
}

// Add member modal
const showAddModal = ref(false)
const addTargetCrew = ref('')
const newMember = ref({ name: '', id: '', role: '학생' })

function openAddModal(crewName) {
  addTargetCrew.value = crewName
  newMember.value = { name: '', id: '', role: '학생' }
  showAddModal.value = true
}

function addMember() {
  if (!newMember.value.id.trim() || !newMember.value.name.trim()) return
  const id = newMember.value.id.trim()
  const IMG = '/soop-img/LOGO'
  if (!customMembers.value[addTargetCrew.value]) {
    customMembers.value[addTargetCrew.value] = []
  }
  customMembers.value[addTargetCrew.value].push({
    name: newMember.value.name.trim(),
    id,
    role: newMember.value.role,
    img: `${IMG}/${id.substring(0, 2)}/${id}/${id}.jpg`,
    category: 'student',
    custom: true,
  })
  saveCustomMembers()
  showAddModal.value = false
  checkLiveStatus()
}

function removeMember(crewName, id) {
  if (!customMembers.value[crewName]) return
  customMembers.value[crewName] = customMembers.value[crewName].filter(m => m.id !== id)
  saveCustomMembers()
}

// API helpers - dev uses Vite proxy, production uses Vercel serverless
const isDev = import.meta.env.DEV

function stationUrl(id) {
  return isDev ? `/soop-chapi/api/${id}/station` : `/api/soop-station?id=${id}`
}

function thumbUrl(bno) {
  return isDev ? `/soop-thumb/m/${bno}` : `/api/soop-thumb?bno=${bno}`
}

// Live status
const liveStatus = ref({})
let liveInterval = null

async function checkLiveStatus() {
  const all = allMembers()
  const promises = all.map(m =>
    fetch(stationUrl(m.id))
      .then(r => r.json())
      .then(data => {
        const broad = data.broad
        if (broad && broad.broad_no) {
          liveStatus.value[m.id] = {
            live: true,
            title: broad.broad_title || '',
            viewers: broad.current_sum_viewer || 0,
            bno: String(broad.broad_no),
          }
        } else {
          liveStatus.value[m.id] = { live: false, title: '', viewers: 0, bno: '' }
        }
      })
      .catch(() => {
        liveStatus.value[m.id] = { live: false, title: '', viewers: 0, bno: '' }
      })
  )
  await Promise.all(promises)
}

function isLive(id) {
  return liveStatus.value[id]?.live || false
}

function liveTitle(id) {
  return liveStatus.value[id]?.title || ''
}

function liveThumb(id) {
  const bno = liveStatus.value[id]?.bno
  return bno ? thumbUrl(bno) : ''
}

function liveViewers(id) {
  return liveStatus.value[id]?.viewers || 0
}

// Preview tooltip
const previewId = ref(null)
const previewPos = ref({ x: 0, y: 0 })

function showPreview(id, event) {
  if (!isLive(id)) return
  previewId.value = id
  updatePreviewPos(event)
}

function updatePreviewPos(event) {
  previewPos.value = { x: event.clientX, y: event.clientY }
}

function hidePreview() {
  previewId.value = null
}

const lastUpdated = ref(null)

async function refreshAll() {
  await checkLiveStatus()
  lastUpdated.value = new Date()
}

onMounted(async () => {
  await refreshAll()
  liveInterval = setInterval(refreshAll, 5 * 60 * 1000)
})

onUnmounted(() => {
  if (liveInterval) clearInterval(liveInterval)
})

function getBoss(crew) {
  return getMembers(crew.name).find(m => m.role === crew.bossRole)
}

function getOtherMembers(crew) {
  const others = getMembers(crew.name).filter(m => m.id !== 'yuambo')
  return others.sort((a, b) => {
    const aLive = isLive(a.id) ? 1 : 0
    const bLive = isLive(b.id) ? 1 : 0
    return bLive - aLive
  })
}

function crewLiveCount(crew) {
  return getMembers(crew.name).filter(m => isLive(m.id)).length
}

function fmt(n) {
  return n.toLocaleString('ko-KR')
}

function onImgError(e) {
  e.target.style.display = 'none'
  e.target.nextElementSibling.style.display = 'flex'
}

function soopLink(id) {
  const bno = liveStatus.value[id]?.bno
  if (bno) return `https://play.sooplive.co.kr/${id}/${bno}`
  return `https://www.sooplive.co.kr/${id}`
}

function getRoleStyle(role) {
  const c = roleColor[role] || roleColor['-']
  return { color: c.color, background: c.bg }
}
</script>

<template>
  <div class="app">
    <!-- Global Header -->
    <div class="global-header">
      <h1 class="global-title">크루 현황판</h1>
      <button class="theme-toggle" @click="isDark = !isDark" :title="isDark ? '라이트 모드' : '다크 모드'">
        {{ isDark ? '☀️' : '🌙' }}
      </button>
    </div>

    <!-- Boss (염보성) -->
    <div class="boss-section" v-if="getBoss(crews[0])">
      <a :href="soopLink(getBoss(crews[0]).id)" target="_blank" class="boss-card"
        @mouseenter="showPreview(getBoss(crews[0]).id, $event)"
        @mousemove="updatePreviewPos($event)"
        @mouseleave="hidePreview"
      >
        <div class="boss-img-wrap">
          <div class="boss-img" :class="{ 'live-ring': isLive(getBoss(crews[0]).id) }">
            <img :src="getBoss(crews[0]).img" :alt="getBoss(crews[0]).name" @error="onImgError" />
            <div class="fallback" style="display:none">{{ getBoss(crews[0]).name[0] }}</div>
          </div>
          <span v-if="isLive(getBoss(crews[0]).id)" class="live-dot-badge">LIVE</span>
        </div>
        <div class="boss-info">
          <span class="boss-role" :style="getRoleStyle(crews[0].bossRole)">{{ crews[0].bossRole }}</span>
          <span class="boss-name">{{ getBoss(crews[0]).name }}</span>
          <span v-if="isLive(getBoss(crews[0]).id)" class="boss-live-title">{{ liveTitle(getBoss(crews[0]).id) }}</span>
        </div>
      </a>
    </div>

    <!-- Crew Sections -->
    <div v-for="crew in crews" :key="crew.name" class="crew-section">
      <!-- Crew Header -->
      <div class="crew-header">
        <div class="crew-left">
          <div class="crew-emblem">
            <img :src="crew.logo" :alt="crew.name" @error="$event.target.style.display='none'" />
          </div>
          <div class="crew-title">
            <h2>{{ crew.name }}</h2>
            <p class="since">SINCE {{ crew.since }}</p>
          </div>
        </div>
        <div class="header-right">
          <div class="live-badge" v-if="crewLiveCount(crew) > 0">
            🔴 LIVE {{ crewLiveCount(crew) }}명
          </div>
          <button class="add-btn" @click="openAddModal(crew.name)" title="멤버 추가">+</button>
        </div>
      </div>

      <!-- Summary -->
      <div class="summary">
        총원 <strong>{{ getMembers(crew.name).length }}명</strong>
      </div>

      <!-- Members Grid -->
      <div class="members-grid">
        <a
          v-for="m in getOtherMembers(crew)"
          :key="m.id"
          :href="soopLink(m.id)"
          target="_blank"
          class="member-item"
          @mouseenter="showPreview(m.id, $event)"
          @mousemove="updatePreviewPos($event)"
          @mouseleave="hidePreview"
        >
          <div class="member-img-wrap">
            <div class="member-img" :class="{ 'live-ring': isLive(m.id) }">
              <img :src="m.img" :alt="m.name" @error="onImgError" />
              <div class="fallback" style="display:none">{{ m.name[0] }}</div>
            </div>
            <span v-if="isLive(m.id)" class="live-dot-badge">LIVE</span>
            <span v-if="m.new" class="new-badge">NEW</span>
            <button v-if="m.custom" class="remove-btn" @click.prevent="removeMember(crew.name, m.id)" title="삭제">×</button>
          </div>
          <span class="member-role" :style="getRoleStyle(m.role)">{{ m.role === '-' ? '기타' : m.role }}</span>
          <span class="member-name">{{ m.name }}</span>
        </a>
      </div>
    </div>

    <!-- Add Member Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal">
        <h3>{{ addTargetCrew }} 멤버 추가</h3>
        <div class="form-group">
          <label>SOOP ID</label>
          <input v-model="newMember.id" placeholder="예: yuambo" />
        </div>
        <div class="form-group">
          <label>이름</label>
          <input v-model="newMember.name" placeholder="예: 염보성" />
        </div>
        <div class="form-group">
          <label>역할</label>
          <input v-model="newMember.role" placeholder="예: 학생" />
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showAddModal = false">취소</button>
          <button class="btn-confirm" @click="addMember">추가</button>
        </div>
      </div>
    </div>

    <!-- Live Preview Tooltip -->
    <Teleport to="body">
      <div
        v-if="previewId && isLive(previewId)"
        class="live-preview"
        :style="{ left: previewPos.x + 16 + 'px', top: previewPos.y - 100 + 'px' }"
      >
        <img :src="liveThumb(previewId)" alt="방송 미리보기" />
        <div class="preview-info">
          <span class="preview-title">{{ liveTitle(previewId) }}</span>
          <span class="preview-viewers">👤 {{ fmt(liveViewers(previewId)) }}명 시청</span>
        </div>
      </div>
    </Teleport>

    <footer class="footer">
      <p>크루 현황판 — poong.today · yxl.kr</p>
      <p v-if="lastUpdated" class="last-update">
        마지막 갱신: {{ lastUpdated.toLocaleTimeString('ko-KR') }} (5분마다 자동 갱신)
      </p>
    </footer>
  </div>
</template>

<style scoped>
.app {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 16px 20px;
  background: var(--bg-card);
  min-height: 100vh;
  transition: background 0.3s;
}

/* Global Header */
.global-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
}
.global-title {
  font-size: 22px;
  font-weight: 900;
  color: var(--text);
}
.theme-toggle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--bg-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: background 0.2s;
  border: 1px solid var(--border);
}
.theme-toggle:hover {
  background: var(--border);
}

/* Crew Section */
.crew-section {
  margin-top: 16px;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--border);
}
.crew-section:last-of-type {
  border-bottom: none;
}

/* Crew Header */
.crew-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 8px;
}
.crew-left {
  display: flex;
  align-items: center;
  gap: 14px;
}
.crew-emblem {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.crew-emblem img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 50%;
}
.crew-title h2 {
  font-size: 24px;
  font-weight: 900;
  color: var(--text);
}
.since {
  font-size: 11px;
  color: #d97706;
  font-weight: 600;
  margin-top: 2px;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.live-badge {
  background: var(--red-bg);
  border: 1px solid #ef444440;
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 11px;
  font-weight: 700;
  color: var(--red);
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
.add-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--chart-bar-from);
  color: #fff;
  font-size: 20px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s;
}
.add-btn:hover {
  transform: scale(1.1);
}

/* Summary */
.summary {
  padding: 6px 0;
  font-size: 12px;
  color: var(--text-sub);
  border-bottom: 1px solid var(--border);
}
.summary strong {
  color: var(--text);
  font-size: 14px;
}

/* Boss */
.boss-section {
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
}
.boss-card {
  display: flex;
  align-items: center;
  gap: 16px;
  text-decoration: none;
  color: inherit;
}
.boss-img-wrap {
  position: relative;
  flex-shrink: 0;
}
.boss-img {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--bg-elevated);
  border: 3px solid #f59e0b;
  box-shadow: 0 0 0 3px rgba(245,158,11,0.2);
}
.boss-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.boss-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.boss-role {
  font-size: 12px;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 10px;
  width: fit-content;
}
.boss-name {
  font-size: 18px;
  font-weight: 800;
  color: var(--text);
}
.boss-live-title {
  font-size: 12px;
  color: var(--text-muted);
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Live styling */
.live-ring {
  border: 3px solid #ef4444 !important;
  box-shadow: 0 0 0 3px rgba(239,68,68,0.3), 0 0 12px rgba(239,68,68,0.2) !important;
  animation: liveGlow 2s ease-in-out infinite;
}
@keyframes liveGlow {
  0%, 100% { box-shadow: 0 0 0 3px rgba(239,68,68,0.3), 0 0 12px rgba(239,68,68,0.2); }
  50% { box-shadow: 0 0 0 3px rgba(239,68,68,0.5), 0 0 20px rgba(239,68,68,0.3); }
}
.live-dot-badge {
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
  background: #ef4444;
  color: #fff;
  font-size: 9px;
  font-weight: 800;
  padding: 1px 6px;
  border-radius: 8px;
  letter-spacing: 0.5px;
  white-space: nowrap;
}
.new-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #f59e0b;
  color: #fff;
  font-size: 8px;
  font-weight: 800;
  padding: 1px 5px;
  border-radius: 6px;
  letter-spacing: 0.5px;
}

/* Members Grid */
.members-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(75px, 1fr));
  gap: 10px 8px;
  padding: 10px 0;
}
.member-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  text-decoration: none;
  color: inherit;
  transition: transform 0.15s;
}
.member-item:hover {
  transform: translateY(-2px);
}
.member-img-wrap {
  position: relative;
}
.member-img {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--bg-elevated);
  border: 2px solid var(--border);
  transition: border-color 0.15s;
}
.member-item:hover .member-img {
  border-color: #f59e0b;
}
.member-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 700;
  color: var(--text-muted);
  background: var(--bg-elevated);
}
.member-role {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
  letter-spacing: 0.3px;
}
.member-name {
  font-size: 11px;
  font-weight: 700;
  color: var(--text);
  text-align: center;
  max-width: 75px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.remove-btn {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ef4444;
  color: #fff;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.15s;
}
.member-item:hover .remove-btn {
  opacity: 1;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}
.modal {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 28px;
  width: 360px;
  max-width: 90vw;
  box-shadow: var(--shadow-md);
}
.modal h3 {
  font-size: 18px;
  font-weight: 800;
  color: var(--text);
  margin-bottom: 20px;
}
.form-group {
  margin-bottom: 14px;
}
.form-group label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-sub);
  margin-bottom: 4px;
}
.form-group input,
.form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-elevated);
  color: var(--text);
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}
.form-group input:focus,
.form-group select:focus {
  border-color: var(--chart-bar-from);
}
.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}
.btn-cancel {
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-sub);
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  transition: background 0.15s;
}
.btn-cancel:hover {
  background: var(--border);
}
.btn-confirm {
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  background: var(--chart-bar-from);
  transition: opacity 0.15s;
}
.btn-confirm:hover {
  opacity: 0.9;
}

.footer {
  text-align: center;
  padding: 20px 0;
  font-size: 11px;
  color: var(--text-muted);
  border-top: 1px solid var(--border);
  margin-top: 16px;
}
.last-update {
  margin-top: 4px;
  font-size: 10px;
  color: var(--text-muted);
  opacity: 0.7;
}

@media (max-width: 640px) {
  .crew-header { flex-wrap: wrap; }
  .members-grid { grid-template-columns: repeat(auto-fill, minmax(75px, 1fr)); gap: 16px 8px; }
  .member-img { width: 60px; height: 60px; }
  .boss-img { width: 64px; height: 64px; }
}
</style>

<style>
.live-preview {
  position: fixed;
  z-index: 9999;
  pointer-events: none;
  background: var(--bg-card, #1a1d27);
  border: 1px solid var(--border, #2a2d3a);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(0,0,0,0.4);
  width: 320px;
}
.live-preview img {
  width: 100%;
  height: 180px;
  object-fit: cover;
  display: block;
}
.preview-info {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.preview-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text, #e2e8f0);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.preview-viewers {
  font-size: 11px;
  color: var(--text-muted, #64748b);
}
</style>
