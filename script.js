
// ── CURSOR ──
const cursor = document.getElementById('cursor');
const dot = document.getElementById('cursor-dot');
let mx = -100, my = -100, cx = -100, cy = -100;
document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
(function loop() {
  cx += (mx - cx) * 0.15;
  cy += (my - cy) * 0.15;
  cursor.style.left = cx + 'px';
  cursor.style.top = cy + 'px';
  dot.style.left = mx + 'px';
  dot.style.top = my + 'px';
  requestAnimationFrame(loop);
})();
document.querySelectorAll('a, button, .btn').forEach(el => {
  el.addEventListener('mouseenter', () => {
    cursor.style.width = '36px'; cursor.style.height = '36px';
    cursor.style.background = 'rgba(0,255,136,0.12)';
  });
  el.addEventListener('mouseleave', () => {
    cursor.style.width = '20px'; cursor.style.height = '20px';
    cursor.style.background = 'transparent';
  });
});

// ── BOOT SEQUENCE ──
const bootLines = [
  { text: 'BIOS v2.4.1 — SUDHARSAN_M PORTFOLIO OS', cls: '' },
  { text: 'Initializing kernel modules...', cls: 'dim' },
  { text: 'Loading: java.runtime.environment .......... [v17.0.9]', cls: 'ok' },
  { text: 'Loading: mysql.connector .................. [8.0.33]', cls: 'ok' },
  { text: 'Loading: git.version.control .............. [2.43.0]', cls: 'ok' },
  { text: 'Loading: apache.tomcat .................... [10.1.x]', cls: 'ok' },
  { text: 'Mounting /projects/hospital-booking ......', cls: 'fail' },
  { text: 'Mounting /projects/meditrust-ai ..........', cls: 'fail' },
  { text: 'Checking credentials: sdhrsan@gmail.com .. [AUTH_OK]', cls: 'cyan' },
  { text: 'Checking GitHub: sudhantech .............. [ONLINE]', cls: 'cyan' },
  { text: 'Status: AVAILABLE_FOR_HIRE', cls: 'amber' },
  { text: '', cls: '' },
  { text: '> Launching portfolio interface...', cls: '' },
];
const bootContainer = document.getElementById('boot-lines');
let i = 0;
function showBootLine() {
  if (i >= bootLines.length) {
    setTimeout(() => {
      document.getElementById('boot-screen').classList.add('hidden');
    }, 500);
    return;
  }
  const line = document.createElement('div');
  line.className = 'boot-line ' + bootLines[i].cls;
  line.textContent = bootLines[i].text;
  line.style.animationDelay = '0ms';
  bootContainer.appendChild(line);
  i++;
  setTimeout(showBootLine, i < 8 ? 100 : i < 11 ? 150 : 300);
}
showBootLine();

// ── TERMINAL TYPEWRITER ──
const termLines = [
  { prompt: true, cmd: 'whoami' },
  { out: 'sudharsan_m — full-stack-dev', cls: 'g' },
  { prompt: true, cmd: 'cat skills.json | grep -i "java"' },
  { out: '"Java", "Servlets", "JSP", "JDBC", "OOP"', cls: 'c' },
  { prompt: true, cmd: 'git log --oneline -3' },
  { out: 'a3f1c2b  hospital-booking: auth module', cls: '' },
  { out: '7d88e41  meditrust: CRAFT pipeline', cls: '' },
  { out: '2b91f3c  intern: bug-fix batch #10', cls: '' },
  { prompt: true, cmd: 'echo $STATUS' },
  { out: 'AVAILABLE_FOR_HIRE ✓', cls: 'a' },
  { prompt: true, cmd: '_', cursor: true },
];
const tbody = document.getElementById('terminal-body');
let tIdx = 0;
function renderTermLine() {
  if (tIdx >= termLines.length) return;
  const item = termLines[tIdx];
  const div = document.createElement('div');
  div.className = 't-line';
  if (item.prompt) {
    div.innerHTML = `<span class="t-prompt">sudharsan@devbox:~$ </span><span class="t-cmd">${item.cmd}</span>`;
  } else if (item.cursor) {
    div.innerHTML = `<span class="t-prompt">sudharsan@devbox:~$ </span><span class="t-cursor"></span>`;
  } else {
    div.innerHTML = `<span class="t-out ${item.cls||''}">${item.out}</span>`;
  }
  tbody.appendChild(div);
  tbody.scrollTop = tbody.scrollHeight;
  tIdx++;
  setTimeout(renderTermLine, item.prompt ? 300 : 80);
}
setTimeout(renderTermLine, 2800);

// ── SCROLL FADE-IN ──
const fadeEls = document.querySelectorAll('.fade-in');
const observer = new IntersectionObserver(entries => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      e.target.style.transitionDelay = (i % 4) * 80 + 'ms';
      e.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });
fadeEls.forEach(el => observer.observe(el));
