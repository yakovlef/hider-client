(() => {
  const connectScreen = document.getElementById('connect-screen');
  const workScreen = document.getElementById('work-screen');
  const serverInput = document.getElementById('server-input');
  const roleSelect = document.getElementById('role-select');
  const connectBtn = document.getElementById('connect-btn');
  const connectStatus = document.getElementById('connect-status');
  const statusDot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');
  const peersInfo = document.getElementById('peers-info');
  const editorArea = document.getElementById('editor-area');
  const editorTextarea = document.getElementById('editor-textarea');
  const readerArea = document.getElementById('reader-area');

  let ws = null;
  let role = null;
  let debounceTimer = null;

  connectBtn.addEventListener('click', connect);
  serverInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') connect(); });

  // Close buttons
  document.getElementById('close-btn-connect').addEventListener('click', () => window.hider.closeWindow());
  document.getElementById('close-btn-work').addEventListener('click', () => window.hider.closeWindow());

  function connect() {
    const addr = serverInput.value.trim();
    if (!addr) return;

    role = roleSelect.value;
    connectBtn.disabled = true;
    connectStatus.textContent = 'Подключение...';
    connectStatus.style.color = '#999';

    const url = `ws://${addr}`;
    ws = new WebSocket(url);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'join', role }));
      showWorkScreen();
    };

    ws.onmessage = (event) => {
      let msg;
      try { msg = JSON.parse(event.data); } catch { return; }

      if (msg.type === 'status') {
        peersInfo.textContent = `Редакторов: ${msg.editors} │ Читателей: ${msg.readers}`;
      }

      if (msg.type === 'content' && role === 'reader') {
        readerArea.textContent = msg.text || '';
        if (!msg.text) {
          readerArea.innerHTML = '<span class="empty-state">Ожидание текста от редактора...</span>';
        }
      }
    };

    ws.onclose = () => {
      statusDot.classList.add('offline');
      statusText.textContent = 'Отключено';
    };

    ws.onerror = () => {
      connectBtn.disabled = false;
      connectStatus.textContent = 'Ошибка подключения';
      connectStatus.style.color = '#ef4444';
    };
  }

  function showWorkScreen() {
    connectScreen.style.display = 'none';
    workScreen.style.display = 'flex';

    if (role === 'editor') {
      editorArea.style.display = 'flex';
      window.hider.resizeWindow(700, 500);
      editorTextarea.focus();

      editorTextarea.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'content', text: editorTextarea.value }));
          }
        }, 300);
      });
    } else {
      readerArea.style.display = 'block';
      window.hider.resizeWindow(500, 350);
    }
  }
})();
