# 크루 현황판 프로젝트

## 프로젝트 개요
YB/YXL/탑문파 크루 멤버 현황판. SOOP 방송 라이브 상태 실시간 표시.
배포 URL: https://poong-chi.vercel.app/
GitHub: https://github.com/7777yjin-arch/poong

## 기술 스택
- Vue 3 + Vite
- Vercel 배포 (자동 배포, push하면 반영)
- Vercel Serverless Functions (API 프록시)

## 프로젝트 구조

```
ygosu-clone/
├── index.html              # 진입점 (타이틀: 스타방송 게시판)
├── vercel.json              # Vercel 배포 설정 + iframe 허용 헤더
├── vite.config.js           # 개발용 프록시 설정
├── 멤버추가법.txt            # 멤버 추가 가이드
├── api/
│   ├── soop-station.js      # chapi.sooplive.co.kr 프록시 (라이브 상태/시청자수)
│   └── soop-thumb.js        # liveimg.sooplive.co.kr 프록시 (방송 썸네일)
├── src/
│   ├── main.js
│   ├── style.css             # 다크모드 CSS 변수 ([data-theme="dark"])
│   ├── App.vue               # 메인 컴포넌트
│   └── data/
│       └── crews.js          # 크루/멤버 데이터 + 역할 색상
├── public/
│   ├── embed.js              # ygosu 임베드용 독립 스크립트
│   └── images/
│       ├── yb/               # YB 멤버 프로필 이미지
│       ├── yxl/              # YXL 멤버 프로필 이미지
│       ├── topmunpa/         # 탑문파 멤버 프로필 이미지
│       ├── YXL_gif.webp      # YXL 로고
│       └── KakaoTalk_*.webp  # 기타 이미지
```

## 핵심 파일 설명

### src/data/crews.js
- 크루 배열: YB, YXL, 탑문파
- 멤버 필드: name, id(SOOP ID), role, tribe, tier, img, category, new(NEW뱃지)
- roleColor: 역할별 뱃지 색상 (수장/대표=빨강, 교수=보라, 사부=보라, 사형제=파랑, 멤버=회색 등)
- roleOrder: 역할 정렬 순서

### src/App.vue
- 레이아웃: 최상단에 염보성(crews[0]의 boss), 그 아래 각 크루 멤버 그리드
- 염보성(id: yuambo)은 상단에 한번만 표시, 크루별 그리드에서는 제외
- 라이브 체크: chapi.sooplive.co.kr API로 5분마다 자동 갱신
- 방송 중 멤버: 빨간 LIVE 뱃지 + 빨간 테두리 + 클릭시 play.sooplive.co.kr로 이동
- 방송 미리보기: 마우스 호버시 썸네일 툴팁
- new: true인 멤버: 주황 NEW 뱃지
- 다크모드: 기본값 다크, 토글 버튼으로 전환, localStorage 저장
- 멤버 추가: + 버튼 클릭 → 모달 → localStorage에 저장 (브라우저별)

### API (dev vs prod)
- 개발: vite.config.js 프록시 (/soop-chapi, /soop-thumb 등)
- 프로덕션: api/soop-station.js, api/soop-thumb.js (Vercel Serverless)
- import.meta.env.DEV로 분기

## SOOP API

### 라이브 상태 확인
```
GET https://chapi.sooplive.co.kr/api/{SOOP_ID}/station
```
- broad.broad_no 있으면 방송 중
- broad.broad_title: 방송 제목
- broad.current_sum_viewer: 시청자 수

### 방송 썸네일
```
GET https://liveimg.sooplive.co.kr/m/{broad_no}
```

### 프로필 이미지
```
https://profile.img.sooplive.co.kr/LOGO/{id앞2글자}/{id}/{id}.jpg
```

## ygosu 임베드
ygosu는 script/iframe src를 필터링함. srcdoc으로 우회:
```html
<iframe width="100%" height="1200" frameborder="0" scrolling="auto"
  srcdoc='&lt;meta http-equiv="refresh" content="0;url=https://poong-chi.vercel.app/"&gt;'
  src=""></iframe>
```

## 멤버 추가/수정
1. src/data/crews.js에서 해당 크루 members 배열에 추가
2. 프로필 이미지를 public/images/{크루폴더}/에 {SOOP_ID}.jpg로 저장
3. git push하면 자동 배포
4. 이미지 없으면 이름 첫 글자로 대체 표시됨
5. new: true 붙이면 NEW 뱃지 표시

## 주의사항
- git push 충돌 자주 발생 (GitHub 웹에서도 수정하기 때문) → git pull --no-rebase 먼저
- embed.js는 별도 유지보수 필요 (crews.js 변경시 embed.js도 같이 수정해야 함)
- vercel.json에 Content-Security-Policy: frame-ancestors * 설정됨 (iframe 허용)
