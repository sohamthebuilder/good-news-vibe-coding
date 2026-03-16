import { useSettingsStore } from './stores/settings';
import type { FontSize } from './types';

const FONT_SIZE_PX: Record<FontSize, string> = {
  small: '15px',
  medium: '16px',
  large: '18px',
};

function applyFontSize(fontSize: FontSize) {
  document.documentElement.style.setProperty(
    '--gn-font-size',
    FONT_SIZE_PX[fontSize] ?? '16px',
  );
}

export function initSettingsBridge() {
  const state = useSettingsStore.getState();
  document.documentElement.classList.remove('dark');
  applyFontSize(state.fontSize);

  useSettingsStore.subscribe((curr, prev) => {
    if (curr.fontSize !== prev.fontSize) applyFontSize(curr.fontSize);

    window.dispatchEvent(
      new CustomEvent('goodnews:settings-changed', {
        detail: {
          fontSize: curr.fontSize,
          allowNeutral: curr.allowNeutral,
        },
      }),
    );
  });
}
