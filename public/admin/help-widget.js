(function() {
  const GUIDES_URL = '/admin-guides.json';
  let guidesData = null;

  // Fetch guides on load
  fetch(GUIDES_URL)
    .then(res => res.json())
    .then(data => {
      guidesData = data;
      initializeHelpSystem();
    })
    .catch(err => console.warn('Failed to load admin guides:', err));

  function initializeHelpSystem() {
    // Create floating help button
    createHelpButton();
    
    // Add help triggers to hint text
    observeForHelpTriggers();
  }

  // Create floating help menu button
  function createHelpButton() {
    const container = document.createElement('div');
    container.id = 'decap-help-container';
    container.innerHTML = `
      <button id="decap-help-menu-toggle" class="decap-help-toggle">?</button>
      <div id="decap-help-menu" class="decap-help-menu hidden">
        <div class="help-menu-header">
          <h3>Admin Guides</h3>
          <button class="help-menu-close">✕</button>
        </div>
        <div class="help-menu-list">
          ${Object.entries(guidesData?.guides || {}).map(([key, guide]) => `
            <button class="help-menu-item" data-guide="${key}">
              ${guide.title}
            </button>
          `).join('')}
        </div>
      </div>
    `;
    document.body.appendChild(container);

    // Event listeners
    document.getElementById('decap-help-menu-toggle').addEventListener('click', () => {
      const menu = document.getElementById('decap-help-menu');
      menu.classList.toggle('hidden');
    });

    document.querySelector('.help-menu-close').addEventListener('click', () => {
      document.getElementById('decap-help-menu').classList.add('hidden');
    });

    document.querySelectorAll('.help-menu-item').forEach(btn => {
      btn.addEventListener('click', () => {
        openGuideModal(btn.getAttribute('data-guide'));
        document.getElementById('decap-help-menu').classList.add('hidden');
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#decap-help-container')) {
        document.getElementById('decap-help-menu').classList.add('hidden');
      }
    });
  }

  // Observe for help triggers in field hints
  function observeForHelpTriggers() {
    const observer = new MutationObserver(() => {
      document.querySelectorAll('.nc-field-hint, .nc-text-small').forEach(hint => {
        if (hint.textContent.includes('?') && !hint.classList.contains('help-enabled')) {
          hint.classList.add('help-enabled');
          addHelpButtonToHint(hint);
        }
      });
    });

    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true
    });
  }

  function addHelpButtonToHint(hintElement) {
    // Extract guide key from hint text if available
    let guideKey = null;
    if (hintElement.textContent.includes('publishing')) guideKey = 'publishing';
    if (hintElement.textContent.includes('content')) guideKey = 'content-rules';
    if (hintElement.textContent.includes('quiz')) guideKey = 'inline-quiz';

    if (guideKey) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'help-hint-btn';
      btn.textContent = '?';
      btn.title = 'Click for help';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openGuideModal(guideKey);
      });
      hintElement.appendChild(btn);
    }
  }

  // Helper to open modal
  function openGuideModal(guideKey) {
    if (!guidesData || !guidesData.guides[guideKey]) {
      alert('Guide not found');
      return;
    }

    const guide = guidesData.guides[guideKey];
    const modal = createModal(guide);
    document.body.appendChild(modal);
    modal.showModal();
  }

  // Create modal HTML
  function createModal(guide) {
    const dialog = document.createElement('dialog');
    dialog.className = 'admin-help-modal';
    dialog.innerHTML = `
      <div class="modal-header">
        <h2>${guide.title}</h2>
        <button class="close-btn" type="button">✕</button>
      </div>
      <div class="modal-content">
        ${guide.sections.map(section => `
          <section>
            <h3>${section.heading}</h3>
            <div class="section-text">${formatContent(section.content)}</div>
          </section>
        `).join('')}
      </div>
    `;

    const closeBtn = dialog.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
      dialog.close();
    });

    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        dialog.close();
      }
    });

    dialog.addEventListener('close', () => {
      dialog.remove();
    });

    return dialog;
  }

  // Format content with basic markdown support
  function formatContent(content) {
    let html = content
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/^\d+\.\s+(.+)$/gm, '<div style="margin-left: 20px;">$&</div>')
      .replace(/^-\s+(.+)$/gm, '<div style="margin-left: 20px;">• $1</div>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/```[\s\S]*?```/g, (match) => {
        const code = match.replace(/```/g, '').trim();
        return `<pre><code>${escapeHtml(code)}</code></pre>`;
      });

    if (!html.startsWith('<p>') && !html.startsWith('<div>') && !html.startsWith('<pre>')) {
      html = `<p>${html}</p>`;
    }

    return html;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    #decap-help-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9000;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    .decap-help-toggle {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #7c3aed;
      color: white;
      border: none;
      font-size: 20px;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .decap-help-toggle:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 16px rgba(124, 58, 237, 0.6);
    }

    .decap-help-toggle:active {
      transform: scale(0.95);
    }

    .decap-help-menu {
      position: absolute;
      bottom: 60px;
      right: 0;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
      min-width: 240px;
      overflow: hidden;
      transition: opacity 0.2s;
    }

    .decap-help-menu.hidden {
      display: none;
    }

    .help-menu-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid #e5e7eb;
      background: #f9fafb;
    }

    .help-menu-header h3 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #111827;
    }

    .help-menu-close {
      background: none;
      border: none;
      cursor: pointer;
      color: #6b7280;
      font-size: 18px;
    }

    .help-menu-close:hover {
      color: #111827;
    }

    .help-menu-list {
      max-height: 300px;
      overflow-y: auto;
    }

    .help-menu-item {
      display: block;
      width: 100%;
      padding: 12px 16px;
      text-align: left;
      background: none;
      border: none;
      border-bottom: 1px solid #f3f4f6;
      cursor: pointer;
      color: #4b5563;
      font-size: 14px;
      transition: background-color 0.15s;
    }

    .help-menu-item:last-child {
      border-bottom: none;
    }

    .help-menu-item:hover {
      background: #f9fafb;
      color: #7c3aed;
    }

    .help-hint-btn {
      background: none;
      border: none;
      color: #7c3aed;
      cursor: pointer;
      font-weight: bold;
      padding: 0 4px;
      font-size: 14px;
      margin-left: 4px;
      vertical-align: middle;
    }

    .help-hint-btn:hover {
      text-decoration: underline;
    }

    .admin-help-modal {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 90%;
      max-width: 650px;
      max-height: 80vh;
      padding: 0;
      border: none;
      border-radius: 8px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    .admin-help-modal::backdrop {
      background: rgba(0, 0, 0, 0.6);
    }

    .admin-help-modal .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid #e5e7eb;
      background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
      color: white;
    }

    .admin-help-modal h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: white;
    }

    .admin-help-modal .close-btn {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: white;
      padding: 0;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background 0.2s;
    }

    .admin-help-modal .close-btn:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .admin-help-modal .modal-content {
      padding: 24px;
      overflow-y: auto;
      max-height: calc(80vh - 70px);
    }

    .admin-help-modal section {
      margin-bottom: 28px;
    }

    .admin-help-modal section:last-child {
      margin-bottom: 0;
    }

    .admin-help-modal h3 {
      margin: 0 0 12px 0;
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
      padding-bottom: 8px;
      border-bottom: 2px solid #f3f4f6;
    }

    .admin-help-modal .section-text {
      font-size: 14px;
      line-height: 1.7;
      color: #4b5563;
    }

    .admin-help-modal .section-text p {
      margin: 0 0 12px 0;
    }

    .admin-help-modal .section-text p:last-child {
      margin-bottom: 0;
    }

    .admin-help-modal code {
      background: #f3f4f6;
      padding: 3px 8px;
      border-radius: 3px;
      font-family: "Menlo", "Monaco", monospace;
      font-size: 13px;
      color: #d946ef;
    }

    .admin-help-modal pre {
      background: #1f2937;
      color: #e5e7eb;
      padding: 16px;
      border-radius: 6px;
      overflow-x: auto;
      font-size: 13px;
      margin: 12px 0;
      line-height: 1.5;
    }

    .admin-help-modal pre code {
      background: none;
      padding: 0;
      color: inherit;
      font-size: inherit;
    }

    .admin-help-modal strong {
      font-weight: 600;
      color: #1f2937;
    }

    .admin-help-modal ul, .admin-help-modal ol {
      margin: 12px 0;
      padding-left: 24px;
    }

    .admin-help-modal li {
      margin-bottom: 8px;
    }

    .admin-help-modal div[style*="margin-left"] {
      margin-bottom: 4px;
    }
  `;
  document.head.appendChild(style);
})();
