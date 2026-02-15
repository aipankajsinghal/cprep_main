async function el(id) { return document.getElementById(id); }

function setStatus(msg) {
  const s = document.getElementById('status');
  if (s) s.textContent = msg;
}

function createCard(item) {
  const card = document.createElement('section');
  card.className = 'card';

  const h = document.createElement('h3');
  h.textContent = item.topic;
  card.appendChild(h);

  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.textContent = `${item.suggested_cluster} — ${item.suggested_angle}`;
  card.appendChild(meta);

  const why = document.createElement('div');
  why.textContent = item.why_it_matters;
  card.appendChild(why);

  const actions = document.createElement('div');
  actions.className = 'actions';

  const gen = document.createElement('button');
  gen.textContent = 'Generate Draft';
  gen.addEventListener('click', async () => {
    gen.disabled = true;
    setStatus('Generating draft...');
    try {
      const resp = await fetch('/api/generate-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: item.topic, angle: item.suggested_angle, cluster: item.suggested_cluster })
      });
      if (!resp.ok) throw new Error('Draft generation failed');
      const data = await resp.json();
      showDraft(card, data);
    } catch (err) {
      alert('Draft generation failed');
    } finally {
      gen.disabled = false;
      setStatus('');
    }
  });
  actions.appendChild(gen);

  const copyBtn = document.createElement('button');
  copyBtn.textContent = 'Copy Topic';
  copyBtn.style.background = '#444';
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(item.topic).then(() => {
      setStatus('Topic copied');
      setTimeout(() => setStatus(''), 1200);
    });
  });
  actions.appendChild(copyBtn);

  card.appendChild(actions);
  return card;
}

function showDraft(container, draft) {
  let box = container.querySelector('.draft');
  if (!box) {
    box = document.createElement('div');
    box.className = 'draft';
    container.appendChild(box);
  }
  box.innerHTML = `<strong>${escapeHtml(draft.title)}</strong>\n\n${escapeHtml(draft.description)}\n\n${escapeHtml(draft.body)}`;

  const copyAll = document.createElement('button');
  copyAll.textContent = 'Copy Draft';
  copyAll.style.marginTop = '8px';
  copyAll.addEventListener('click', () => {
    navigator.clipboard.writeText(`# ${draft.title}\n\n${draft.description}\n\n${draft.body}`).then(()=>{
      setStatus('Draft copied'); setTimeout(()=>setStatus(''),1200);
    });
  });
  container.appendChild(copyAll);
}

function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

async function discover() {
  setStatus('Fetching trends...');
  const results = document.getElementById('results');
  results.innerHTML = '';
  try {
    const resp = await fetch('/api/trends');
    if (!resp.ok) throw new Error('Trends fetch failed');
    const payload = await resp.json();
    const items = payload.items ?? [];
    if (!items.length) {
      results.textContent = 'No relevant trends found.';
      setStatus('');
      return;
    }
    for (const it of items) {
      const card = createCard(it);
      results.appendChild(card);
    }
  } catch (err) {
    results.textContent = 'Unable to fetch trends.';
  } finally {
    setStatus('');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('discover').addEventListener('click', discover);
});
