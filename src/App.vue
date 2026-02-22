<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { crews, roleColor, roleOrder } from './data/crews.js'

// Theme
const isDark = ref(localStorage.getItem('theme') !== 'light')
watch(isDark, (v) => {
  document.documentElement.setAttribute('data-theme', v ? 'dark' : 'light')
  localStorage.setItem('theme', v ? 'dark' : 'light')
}, { immediate: true })

// === Tab System ===
const defaultTabs = [
  { id: 'dashboard', label: '현황판' },
  { id: 'live', label: '라이브' },
  { id: 'notice', label: '숲 공지' },
]

function loadTabOrder() {
  try {
    const saved = JSON.parse(localStorage.getItem('tabOrder'))
    if (Array.isArray(saved)) {
      const mapped = saved.map(id => defaultTabs.find(t => t.id === id)).filter(Boolean)
      // Add any new tabs that weren't in saved order
      for (const tab of defaultTabs) {
        if (!mapped.find(t => t.id === tab.id)) mapped.push(tab)
      }
      if (mapped.length === defaultTabs.length) return mapped
    }
  } catch {}
  return [...defaultTabs]
}

const tabs = ref(loadTabOrder())
const activeTab = ref(tabs.value[0].id)

function saveTabOrder() {
  localStorage.setItem('tabOrder', JSON.stringify(tabs.value.map(t => t.id)))
}

// Drag & drop tabs
const dragTabId = ref(null)

function onTabDragStart(e, tabId) {
  dragTabId.value = tabId
  e.dataTransfer.effectAllowed = 'move'
}

function onTabDragOver(e, tabId) {
  e.preventDefault()
  if (!dragTabId.value || dragTabId.value === tabId) return
  const arr = [...tabs.value]
  const fromIdx = arr.findIndex(t => t.id === dragTabId.value)
  const toIdx = arr.findIndex(t => t.id === tabId)
  if (fromIdx === -1 || toIdx === -1) return
  const [item] = arr.splice(fromIdx, 1)
  arr.splice(toIdx, 0, item)
  tabs.value = arr
}

function onTabDragEnd() {
  dragTabId.value = null
  saveTabOrder()
}

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

function postsUrl(id) {
  return isDev ? `/soop-channel/v1.1/channel/${id}/home/section/post` : `/api/soop-posts?id=${id}`
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

// Crew filter (shared across live & notice tabs)
const crewFilter = ref('전체')
const crewNames = computed(() => ['전체', ...crews.map(c => c.name)])

// Live tab data
const allLiveMembers = computed(() => {
  const all = allMembers()
  return all
    .filter(m => m.id !== 'yuambo' && isLive(m.id))
    .sort((a, b) => liveViewers(b.id) - liveViewers(a.id))
})

const liveMembers = computed(() => {
  if (crewFilter.value === '전체') return allLiveMembers.value
  return allLiveMembers.value.filter(m => getMemberCrew(m.id) === crewFilter.value)
})

const totalLiveCount = computed(() => allLiveMembers.value.length)
const totalLiveViewers = computed(() => {
  return liveMembers.value.reduce((sum, m) => sum + liveViewers(m.id), 0)
})

function getMemberCrew(id) {
  for (const crew of crews) {
    if (getMembers(crew.name).some(m => m.id === id)) return crew.name
  }
  return ''
}

// === SOOP Posts (숲 공지) ===
const soopPosts = ref([])
const postsLoading = ref(false)

async function fetchAllPosts() {
  postsLoading.value = true
  const all = allMembers()
  const results = []

  const promises = all.map(m =>
    fetch(postsUrl(m.id))
      .then(r => r.json())
      .then(data => {
        if (data.posts && data.posts.length > 0) {
          // Only include notice posts from the BJ, today only (since midnight)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const notices = data.posts.filter(p => p.isNotice && p.userId === m.id && new Date(p.regDate) >= today)
          for (const post of notices) {
            results.push({
              ...post,
              soopId: m.id,
              memberName: m.name,
              memberRole: m.role,
            })
          }
        }
      })
      .catch(() => {})
  )

  await Promise.all(promises)
  // Sort by date descending
  results.sort((a, b) => new Date(b.regDate) - new Date(a.regDate))
  soopPosts.value = results
  postsLoading.value = false
}

function timeAgo(dateStr) {
  const now = new Date()
  const date = new Date(dateStr)
  const diff = Math.floor((now - date) / 1000)
  if (diff < 60) return '방금 전'
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`
  return date.toLocaleDateString('ko-KR')
}

const filteredPosts = computed(() => {
  if (crewFilter.value === '전체') return soopPosts.value
  return soopPosts.value.filter(p => getMemberCrew(p.soopId) === crewFilter.value)
})

function postLink(post) {
  return `https://www.sooplive.co.kr/station/${post.soopId}/post/${post.titleNo}`
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

function getBoss(crew) {
  return getMembers(crew.name).find(m => m.role === crew.bossRole)
}

function getOtherMembers(crew) {
  const others = getMembers(crew.name).filter(m => m.id !== 'yuambo')
  return others.sort((a, b) => {
    // 지우리 항상 맨 끝
    if (a.id === TROLL_ID) return 1
    if (b.id === TROLL_ID) return -1
    // 라이브 우선 정렬
    const aLive = isLive(a.id) ? 1 : 0
    const bLive = isLive(b.id) ? 1 : 0
    if (aLive !== bLive) return bLive - aLive
    // 같은 라이브 상태 내에서 역할 순서
    const aRole = roleOrder.indexOf(a.role)
    const bRole = roleOrder.indexOf(b.role)
    return aRole - bRole
  })
}

function crewLiveCount(crew) {
  return getMembers(crew.name).filter(m => m.id !== 'yuambo' && isLive(m.id)).length
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

// === Anti-capture trolling for jiwooris2 ===
const TROLL_ID = 'jiwooris2'
const trollHidden = ref(false)

function triggerTroll() {
  trollHidden.value = true
  trollRunAway.value = true
}

function isTrollTarget(id) {
  return id === TROLL_ID
}

// 1. PrintScreen key detection
function onKeyCapture(e) {
  if (e.key === 'PrintScreen' || (e.ctrlKey && e.shiftKey && e.key === 'S')) {
    e.preventDefault()
    triggerTroll()
  }
}

// 2. Window blur detection (Ctrl+Win+S, Snipping Tool, Alt+Tab)
function onWindowBlur() {
  triggerTroll()
}

// 3. Right-click prevention on troll target
function onTrollRightClick(e) {
  e.preventDefault()
}

// 4. Mouse dodge - card runs away then disappears
const trollDodge = ref({ x: 0, y: 0 })
const trollRunAway = ref(false)

function onTrollMouseEnter(e) {
  if (trollRunAway.value) return
  const dx = (Math.random() > 0.5 ? 1 : -1) * (200 + Math.random() * 300)
  const dy = -150 - Math.random() * 200
  trollDodge.value = { x: dx, y: dy }
  trollRunAway.value = true
}

function onTrollMouseLeave() {}

function getTrollStyle(id) {
  if (id !== TROLL_ID) return {}
  if (trollRunAway.value) {
    return {
      transform: `translate(${trollDodge.value.x}px, ${trollDodge.value.y}px) scale(0)`,
      opacity: 0,
      transition: 'transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.4s ease 0.2s',
      pointerEvents: 'none',
    }
  }
  return {}
}

onMounted(async () => {
  document.addEventListener('keyup', onKeyCapture)
  window.addEventListener('blur', onWindowBlur)
  await refreshAll()
  fetchAllPosts()
  liveInterval = setInterval(refreshAll, 5 * 60 * 1000)
})

onUnmounted(() => {
  document.removeEventListener('keyup', onKeyCapture)
  window.removeEventListener('blur', onWindowBlur)
  if (liveInterval) clearInterval(liveInterval)
})
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

    <!-- Tab Bar (draggable) -->
    <div class="tab-bar">
      <div
        v-for="tab in tabs"
        :key="tab.id"
        :class="['tab-item', { active: activeTab === tab.id, dragging: dragTabId === tab.id }]"
        draggable="true"
        @dragstart="onTabDragStart($event, tab.id)"
        @dragover="onTabDragOver($event, tab.id)"
        @dragend="onTabDragEnd"
        @click="activeTab = tab.id"
      >
        <span class="tab-label">{{ tab.label }}</span>
        <span v-if="tab.id === 'live' && totalLiveCount > 0" class="tab-live-count">{{ totalLiveCount }}</span>
        <span v-if="tab.id === 'notice' && soopPosts.length > 0" class="tab-notice-count">{{ soopPosts.length }}</span>
        <span class="tab-drag-handle">⠿</span>
      </div>
    </div>

    <!-- ========== DASHBOARD TAB ========== -->
    <template v-if="activeTab === 'dashboard'">
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

        <div class="summary">
          총원 <strong>{{ getMembers(crew.name).length }}명</strong>
        </div>

        <div class="members-grid">
          <a
            v-for="m in getOtherMembers(crew)"
            :key="m.id"
            :href="soopLink(m.id)"
            target="_blank"
            :class="['member-item', { 'troll-hidden': isTrollTarget(m.id) && trollHidden }]"
            :style="getTrollStyle(m.id)"
            @mouseenter="isTrollTarget(m.id) ? onTrollMouseEnter($event) : showPreview(m.id, $event)"
            @mousemove="!isTrollTarget(m.id) && updatePreviewPos($event)"
            @mouseleave="isTrollTarget(m.id) ? onTrollMouseLeave() : hidePreview()"
            @contextmenu="isTrollTarget(m.id) && onTrollRightClick($event)"
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
    </template>

    <!-- ========== LIVE TAB ========== -->
    <template v-if="activeTab === 'live'">
      <div class="live-tab">
        <!-- Crew Filter -->
        <div class="crew-filter">
          <button
            v-for="name in crewNames"
            :key="name"
            :class="['filter-btn', { active: crewFilter === name }]"
            @click="crewFilter = name"
          >{{ name }}</button>
        </div>

        <!-- Live Summary -->
        <div class="live-summary" v-if="totalLiveCount > 0">
          <span class="live-summary-dot">●</span>
          <span>현재 <strong>{{ totalLiveCount }}명</strong> 방송 중</span>
          <span class="live-summary-viewers">총 시청자 <strong>{{ fmt(totalLiveViewers) }}명</strong></span>
        </div>

        <!-- No live streams -->
        <div v-if="totalLiveCount === 0" class="live-empty">
          <div class="live-empty-icon">📡</div>
          <p>현재 방송 중인 멤버가 없습니다</p>
          <p class="live-empty-sub">5분마다 자동으로 확인합니다</p>
        </div>

        <!-- Live Cards -->
        <div class="live-grid">
          <a
            v-for="m in liveMembers"
            :key="m.id"
            :href="soopLink(m.id)"
            target="_blank"
            :class="['live-card', { 'troll-hidden': isTrollTarget(m.id) && trollHidden }]"
            @contextmenu="isTrollTarget(m.id) && onTrollRightClick($event)"
          >
            <!-- Thumbnail -->
            <div class="live-card-thumb">
              <img :src="liveThumb(m.id)" :alt="m.name + ' 방송'" />
              <div class="live-card-viewers">
                <span class="live-card-dot">●</span>
                {{ fmt(liveViewers(m.id)) }}명
              </div>
            </div>

            <!-- Info -->
            <div class="live-card-info">
              <div class="live-card-profile">
                <div class="live-card-avatar">
                  <img :src="m.img" :alt="m.name" @error="onImgError" />
                  <div class="fallback" style="display:none">{{ m.name[0] }}</div>
                </div>
                <div class="live-card-meta">
                  <span class="live-card-name">{{ m.name }}</span>
                  <span class="live-card-crew">{{ getMemberCrew(m.id) }}</span>
                </div>
                <span class="live-card-role" :style="getRoleStyle(m.role)">{{ m.role === '-' ? '기타' : m.role }}</span>
              </div>
              <p class="live-card-title">{{ liveTitle(m.id) }}</p>
            </div>
          </a>
        </div>
      </div>
    </template>

    <!-- ========== NOTICE TAB (숲 공지) ========== -->
    <template v-if="activeTab === 'notice'">
      <div class="notice-tab">
        <!-- Crew Filter -->
        <div class="crew-filter">
          <button
            v-for="name in crewNames"
            :key="name"
            :class="['filter-btn', { active: crewFilter === name }]"
            @click="crewFilter = name"
          >{{ name }}</button>
        </div>

        <div class="notice-header">
          <h2 class="notice-title">숲 공지 <span v-if="filteredPosts.length" class="notice-count">({{ filteredPosts.length }})</span></h2>
        </div>

        <!-- Loading -->
        <div v-if="postsLoading && soopPosts.length === 0" class="notice-loading">
          <div class="spinner"></div>
          <p>공지 불러오는 중...</p>
        </div>

        <!-- Empty -->
        <div v-else-if="filteredPosts.length === 0" class="notice-empty">
          <p>최근 공지가 없습니다</p>
        </div>

        <!-- Posts List -->
        <div v-else class="notice-list">
          <a
            v-for="post in filteredPosts"
            :key="post.titleNo"
            :href="postLink(post)"
            target="_blank"
            class="notice-item"
          >
            <div class="notice-item-left">
              <div class="notice-avatar">
                <img :src="post.profileImage" :alt="post.userNick" @error="onImgError" />
                <div class="fallback" style="display:none">{{ post.userNick[0] }}</div>
              </div>
            </div>
            <div class="notice-item-body">
              <div class="notice-item-top">
                <span class="notice-author">{{ post.userNick }}</span>
                <span class="notice-time">{{ timeAgo(post.regDate) }}</span>
              </div>
              <div class="notice-item-title">
                <span v-if="post.isPin" class="notice-pin-badge">PIN</span>
                <span class="notice-title-text">{{ post.titleName }}</span>
              </div>
              <p v-if="post.content && post.content.trim()" class="notice-item-content">{{ post.content.trim() }}</p>
              <div class="notice-item-stats">
                <span class="notice-stat"><span class="stat-icon">👁</span> {{ fmt(post.readCnt) }}</span>
                <span class="notice-stat"><span class="stat-icon">💬</span> {{ post.commentCnt }}</span>
                <span v-if="post.imageCount > 0" class="notice-stat"><span class="stat-icon">🖼</span> {{ post.imageCount }}</span>
              </div>
            </div>
            <div v-if="post.fileUrl" class="notice-item-thumb">
              <img :src="post.fileUrl" alt="" />
            </div>
          </a>
        </div>
      </div>
    </template>

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

/* ===== Tab Bar ===== */
.tab-bar {
  display: flex;
  gap: 0;
  border-bottom: 2px solid var(--border);
  margin-top: 0;
  user-select: none;
}
.tab-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-muted);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: color 0.15s, border-color 0.15s;
  position: relative;
}
.tab-item:hover {
  color: var(--text);
}
.tab-item.active {
  color: var(--text);
  border-bottom-color: var(--chart-bar-from, #6366f1);
}
.tab-item.dragging {
  opacity: 0.4;
}
.tab-live-count {
  background: #ef4444;
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  padding: 1px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
  animation: pulse 2s infinite;
}
.tab-drag-handle {
  font-size: 12px;
  color: var(--text-muted);
  opacity: 0;
  transition: opacity 0.15s;
  cursor: grab;
  margin-left: 2px;
}
.tab-item:hover .tab-drag-handle {
  opacity: 0.5;
}
.tab-item:active .tab-drag-handle {
  cursor: grabbing;
}

/* ===== Crew Filter ===== */
.crew-filter {
  display: flex;
  gap: 6px;
  padding: 12px 0 4px;
  flex-wrap: wrap;
}
.filter-btn {
  padding: 5px 14px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-muted);
  background: var(--bg-elevated, #1e2130);
  border: 1px solid var(--border);
  cursor: pointer;
  transition: all 0.15s;
}
.filter-btn:hover {
  color: var(--text);
  border-color: var(--text-muted);
}
.filter-btn.active {
  color: #fff;
  background: var(--chart-bar-from, #6366f1);
  border-color: var(--chart-bar-from, #6366f1);
}

/* ===== Live Tab ===== */
.live-tab {
  padding: 16px 0;
}
.live-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--red-bg, rgba(239,68,68,0.08));
  border: 1px solid rgba(239,68,68,0.2);
  border-radius: 10px;
  margin-bottom: 16px;
  font-size: 13px;
  color: var(--text);
}
.live-summary-dot {
  color: #ef4444;
  font-size: 10px;
  animation: pulse 2s infinite;
}
.live-summary-viewers {
  margin-left: auto;
  color: var(--text-sub);
  font-size: 12px;
}
.live-empty {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-muted);
}
.live-empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}
.live-empty p {
  font-size: 15px;
  font-weight: 600;
}
.live-empty-sub {
  font-size: 12px !important;
  font-weight: 400 !important;
  margin-top: 6px;
  opacity: 0.7;
}
.live-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
.live-card {
  display: flex;
  flex-direction: column;
  background: var(--bg-elevated, #1e2130);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
}
.live-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
  border-color: #ef4444;
}

/* Thumbnail */
.live-card-thumb {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: #000;
}
.live-card-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.live-card-viewers {
  position: absolute;
  bottom: 8px;
  left: 8px;
  background: rgba(0,0,0,0.75);
  backdrop-filter: blur(4px);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
}
.live-card-dot {
  color: #ef4444;
  font-size: 8px;
}

/* Card Info */
.live-card-info {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.live-card-profile {
  display: flex;
  align-items: center;
  gap: 10px;
}
.live-card-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--bg-card);
  border: 2px solid #ef4444;
  flex-shrink: 0;
}
.live-card-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.live-card-meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}
.live-card-name {
  font-size: 14px;
  font-weight: 800;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.live-card-crew {
  font-size: 11px;
  color: var(--text-muted);
}
.live-card-role {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
  flex-shrink: 0;
}
.live-card-title {
  font-size: 13px;
  color: var(--text-sub);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
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

/* ===== Notice Tab (숲 공지) ===== */
.notice-tab {
  padding: 16px 0;
}
.notice-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.notice-title {
  font-size: 18px;
  font-weight: 900;
  color: var(--text);
}
.notice-count {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-muted);
}
.tab-notice-count {
  background: #6366f1;
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  padding: 1px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}
.notice-loading {
  text-align: center;
  padding: 40px 0;
  color: var(--text-muted);
}
.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid var(--border);
  border-top-color: var(--chart-bar-from, #6366f1);
  border-radius: 50%;
  margin: 0 auto 12px;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.notice-empty {
  text-align: center;
  padding: 40px 0;
  color: var(--text-muted);
  font-size: 14px;
}
.notice-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.notice-item {
  display: flex;
  gap: 12px;
  padding: 14px 12px;
  text-decoration: none;
  color: inherit;
  border-radius: 10px;
  transition: background 0.15s;
  border-bottom: 1px solid var(--border);
}
.notice-item:last-child {
  border-bottom: none;
}
.notice-item:hover {
  background: var(--bg-elevated, rgba(255,255,255,0.03));
}
.notice-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--bg-elevated);
  flex-shrink: 0;
  border: 2px solid var(--border);
}
.notice-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.notice-item-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.notice-item-top {
  display: flex;
  align-items: center;
  gap: 8px;
}
.notice-author {
  font-size: 13px;
  font-weight: 800;
  color: var(--text);
}
.notice-time {
  font-size: 11px;
  color: var(--text-muted);
}
.notice-item-title {
  display: flex;
  align-items: center;
  gap: 6px;
}
.notice-pin-badge {
  background: #f59e0b;
  color: #fff;
  font-size: 9px;
  font-weight: 800;
  padding: 1px 5px;
  border-radius: 4px;
  flex-shrink: 0;
}
.notice-title-text {
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.notice-item-content {
  font-size: 12px;
  color: var(--text-sub);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.notice-item-stats {
  display: flex;
  gap: 12px;
  margin-top: 2px;
}
.notice-stat {
  font-size: 11px;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 3px;
}
.stat-icon {
  font-size: 12px;
}
.notice-item-thumb {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  background: var(--bg-elevated);
}
.notice-item-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (max-width: 640px) {
  .notice-item-thumb {
    width: 48px;
    height: 48px;
  }
  .notice-avatar {
    width: 34px;
    height: 34px;
  }
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

/* ===== Anti-capture troll ===== */
.troll-hidden {
  opacity: 0 !important;
  pointer-events: none !important;
  transition: opacity 0.05s !important;
}

@media print {
  .member-item:has([alt="지우리♥"]),
  .live-card:has([alt="지우리♥"]) {
    display: none !important;
  }
}

@media (max-width: 640px) {
  .crew-header { flex-wrap: wrap; }
  .members-grid { grid-template-columns: repeat(auto-fill, minmax(75px, 1fr)); gap: 16px 8px; }
  .member-img { width: 60px; height: 60px; }
  .boss-img { width: 64px; height: 64px; }
  .live-grid { grid-template-columns: 1fr; }
  .tab-item { padding: 10px 14px; font-size: 13px; }
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

/* Troll: prevent image drag/save */
.troll-no-drag img {
  -webkit-user-drag: none;
  user-select: none;
  pointer-events: none;
}
</style>
