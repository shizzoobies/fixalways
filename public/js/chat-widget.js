/**
 * FixAlways — Claude-powered Help Chat Widget
 * Floating bottom-right chat with Anthropic Claude integration.
 */

const CLAUDE_API_KEY = '%%ANTHROPIC_API_KEY%%';  // Replace with your key or use a backend proxy
const CLAUDE_MODEL   = 'claude-sonnet-4-20250514';

const SYSTEM_PROMPT = `You are FixAlways's friendly AI assistant. FixAlways is a Florida home-services directory that helps people find trusted local pros.

Services covered: HVAC, Plumbing, Electrical, Roofing, Pest Control, Handyman.
Coverage: 188+ cities across Florida.
How it works: Users browse by city → view listings with real ratings, reviews, phone & website → contact the company directly.

Guidelines:
- Be concise, helpful, and warm.
- If someone asks about a specific city or service, suggest they browse that city page (e.g. /fl/tampa/hvac).
- You can help with general home-service questions (when to service an AC, signs of plumbing issues, etc.).
- Never make up business names or phone numbers — direct users to browse listings on the site.
- Keep responses short (2-3 sentences max unless they ask for detail).`;

// ─── State ───────────────────────────────────────────
let messages = [];
let isOpen = false;
let isTyping = false;

// ─── Build DOM ───────────────────────────────────────
function createWidget() {
  const widget = document.createElement('div');
  widget.id = 'fa-chat';
  widget.innerHTML = `
    <button id="fa-chat-toggle" aria-label="Open help chat">
      <svg class="fa-chat-icon-open" width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 2C6.48 2 2 5.92 2 10.67c0 2.74 1.51 5.18 3.87 6.77-.13 1.25-.72 2.93-1.87 4.06 0 0 3.21-.13 5.37-1.87.87.13 1.74.2 2.63.2 5.52 0 10-3.92 10-8.83S17.52 2 12 2Z" fill="url(#chat-grad)" stroke="rgba(240,165,74,0.3)" stroke-width="1"/>
        <circle cx="8" cy="11" r="1.25" fill="white" opacity="0.9"/>
        <circle cx="12" cy="11" r="1.25" fill="white" opacity="0.9"/>
        <circle cx="16" cy="11" r="1.25" fill="white" opacity="0.9"/>
        <defs>
          <linearGradient id="chat-grad" x1="2" y1="2" x2="22" y2="22">
            <stop offset="0%" stop-color="#f0a54a"/>
            <stop offset="100%" stop-color="#e8734a"/>
          </linearGradient>
        </defs>
      </svg>
      <svg class="fa-chat-icon-close" width="20" height="20" viewBox="0 0 20 20" fill="none" style="display:none">
        <path d="M5 5l10 10M15 5L5 15" stroke="white" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <span class="fa-chat-pulse"></span>
    </button>

    <div id="fa-chat-panel" class="fa-chat-hidden">
      <div class="fa-chat-header">
        <div class="fa-chat-header-left">
          <div class="fa-chat-avatar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 5.92 2 10.67c0 2.74 1.51 5.18 3.87 6.77-.13 1.25-.72 2.93-1.87 4.06 0 0 3.21-.13 5.37-1.87.87.13 1.74.2 2.63.2 5.52 0 10-3.92 10-8.83S17.52 2 12 2Z" fill="url(#av-grad)"/>
              <defs><linearGradient id="av-grad" x1="2" y1="2" x2="22" y2="22"><stop offset="0%" stop-color="#f0a54a"/><stop offset="100%" stop-color="#e8734a"/></linearGradient></defs>
            </svg>
          </div>
          <div>
            <div class="fa-chat-header-title">FixAlways AI</div>
            <div class="fa-chat-header-sub">Powered by Claude</div>
          </div>
        </div>
        <button class="fa-chat-close" aria-label="Close chat">&times;</button>
      </div>

      <div class="fa-chat-messages" id="fa-chat-messages">
        <div class="fa-chat-welcome">
          <div class="fa-chat-welcome-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 5.92 2 10.67c0 2.74 1.51 5.18 3.87 6.77-.13 1.25-.72 2.93-1.87 4.06 0 0 3.21-.13 5.37-1.87.87.13 1.74.2 2.63.2 5.52 0 10-3.92 10-8.83S17.52 2 12 2Z" fill="url(#w-grad)"/>
              <circle cx="8" cy="11" r="1" fill="white" opacity="0.9"/>
              <circle cx="12" cy="11" r="1" fill="white" opacity="0.9"/>
              <circle cx="16" cy="11" r="1" fill="white" opacity="0.9"/>
              <defs><linearGradient id="w-grad" x1="2" y1="2" x2="22" y2="22"><stop offset="0%" stop-color="#f0a54a"/><stop offset="100%" stop-color="#e8734a"/></linearGradient></defs>
            </svg>
          </div>
          <div class="fa-chat-welcome-title">Hi! I'm the FixAlways AI assistant.</div>
          <div class="fa-chat-welcome-sub">Ask me about home services, finding pros in your city, or how the site works.</div>
          <div class="fa-chat-quick-actions">
            <button class="fa-chat-quick" data-msg="How do I find an HVAC company near me?">Find HVAC pros</button>
            <button class="fa-chat-quick" data-msg="What services does FixAlways cover?">Services offered</button>
            <button class="fa-chat-quick" data-msg="How often should I service my AC?">AC maintenance tips</button>
          </div>
        </div>
      </div>

      <div class="fa-chat-input-wrap">
        <input id="fa-chat-input" type="text" placeholder="Ask anything..." autocomplete="off" />
        <button id="fa-chat-send" aria-label="Send message">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(widget);
  bindEvents();
}

// ─── Events ──────────────────────────────────────────
function bindEvents() {
  const toggle = document.getElementById('fa-chat-toggle');
  const panel  = document.getElementById('fa-chat-panel');
  const close  = document.querySelector('.fa-chat-close');
  const input  = document.getElementById('fa-chat-input');
  const send   = document.getElementById('fa-chat-send');

  toggle.addEventListener('click', () => toggleChat());
  close.addEventListener('click',  () => toggleChat(false));
  send.addEventListener('click',   () => sendMessage());
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } });

  // Quick action buttons
  document.querySelectorAll('.fa-chat-quick').forEach(btn => {
    btn.addEventListener('click', () => {
      const msg = btn.dataset.msg;
      document.getElementById('fa-chat-input').value = msg;
      sendMessage();
    });
  });
}

function toggleChat(forceState) {
  isOpen = forceState !== undefined ? forceState : !isOpen;
  const panel   = document.getElementById('fa-chat-panel');
  const openIc  = document.querySelector('.fa-chat-icon-open');
  const closeIc = document.querySelector('.fa-chat-icon-close');
  const pulse   = document.querySelector('.fa-chat-pulse');

  if (isOpen) {
    panel.classList.remove('fa-chat-hidden');
    openIc.style.display  = 'none';
    closeIc.style.display = 'block';
    pulse.style.display   = 'none';
    setTimeout(() => document.getElementById('fa-chat-input').focus(), 200);
  } else {
    panel.classList.add('fa-chat-hidden');
    openIc.style.display  = 'block';
    closeIc.style.display = 'none';
  }
}

// ─── Messages ────────────────────────────────────────
function addMessage(role, text) {
  const container = document.getElementById('fa-chat-messages');
  const welcome = container.querySelector('.fa-chat-welcome');
  if (welcome) welcome.style.display = 'none';

  const bubble = document.createElement('div');
  bubble.className = `fa-chat-msg fa-chat-msg-${role}`;
  bubble.textContent = text;
  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
}

function showTyping() {
  const container = document.getElementById('fa-chat-messages');
  const typing = document.createElement('div');
  typing.className = 'fa-chat-msg fa-chat-msg-assistant fa-chat-typing';
  typing.id = 'fa-chat-typing';
  typing.innerHTML = '<span></span><span></span><span></span>';
  container.appendChild(typing);
  container.scrollTop = container.scrollHeight;
}

function hideTyping() {
  const el = document.getElementById('fa-chat-typing');
  if (el) el.remove();
}

// ─── Send / API ──────────────────────────────────────
async function sendMessage() {
  const input = document.getElementById('fa-chat-input');
  const text = input.value.trim();
  if (!text || isTyping) return;

  input.value = '';
  addMessage('user', text);
  messages.push({ role: 'user', content: text });

  isTyping = true;
  showTyping();

  try {
    const reply = await callClaude(messages);
    hideTyping();
    addMessage('assistant', reply);
    messages.push({ role: 'assistant', content: reply });
  } catch (err) {
    hideTyping();
    const errMsg = CLAUDE_API_KEY.includes('%%')
      ? 'API key not configured yet. Add your Anthropic key in chat-widget.js to enable AI responses.'
      : 'Sorry, something went wrong. Please try again.';
    addMessage('assistant', errMsg);
  }

  isTyping = false;
}

async function callClaude(msgs) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: msgs.slice(-10),   // keep context window small
    }),
  });

  if (!res.ok) throw new Error(`API ${res.status}`);
  const data = await res.json();
  return data.content[0].text;
}

// ─── Init ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', createWidget);
