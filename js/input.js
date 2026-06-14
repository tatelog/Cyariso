// 入力管理。チャリ走に忠実に「ジャンプのみ」。
// 画面どこでもタップ/クリック、Space/↑、タッチでジャンプ。
export function bindJump(canvas, onJump) {
  const trigger = (e) => {
    // UI（ボタン等）操作はジャンプにしない。
    if (e.target && e.target.closest && e.target.closest('.overlay')) return;
    onJump();
  };

  // pointerdown は mouse/touch/pen を統一して拾える。
  window.addEventListener('pointerdown', trigger);

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
      e.preventDefault();
      onJump();
    }
  });
}
