// engine/progress.js — 진행 데이터 키 관리 및 초기화 단일 창구
export const KEY = {
  world: 'u6_world_state',
  loc: 'u6_current_location',
  step: 'u6_location_step',
  cleared: 'u6_cleared_steps',
  cheated: 'u6_cheat_steps',
  name: 'u6_player_name',
  muted: 'u6_muted',
};

const RESET_KEYS = [KEY.world, KEY.loc, KEY.step, KEY.cleared, KEY.cheated];

/**
 * 이 앱의 진행 데이터만 선택적으로 초기화합니다.
 * (동일 오리진의 다른 앱 데이터 보호를 위해 localStorage.clear()는 절대 사용하지 않습니다)
 * @param {{keepName?: boolean}} opts
 */
export function clearProgress({ keepName = true } = {}) {
  try {
    RESET_KEYS.forEach((k) => localStorage.removeItem(k));
    if (!keepName) {
      localStorage.removeItem(KEY.name);
    }
  } catch (e) {
    console.warn('[progress] 저장소 초기화 실패:', e);
  }
}
