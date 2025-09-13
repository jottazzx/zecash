// zecash.js — versão com melhorias de acessibilidade e responsividade

// Ano atual
document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());

// Menu mobile com ARIA e sem layout shift
const toggle = document.getElementById('mobileToggle');
const menu = document.getElementById('menu');
if (toggle && menu){
  const open = () => { menu.classList.add('is-open'); toggle.setAttribute('aria-expanded','true'); };
  const close = () => { menu.classList.remove('is-open'); toggle.setAttribute('aria-expanded','false'); };
  toggle.setAttribute('aria-expanded','false');
  toggle.addEventListener('click',()=> menu.classList.contains('is-open') ? close() : open());
  document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') close(); });
  window.addEventListener('resize', ()=>{ if(window.innerWidth >= 768) close(); });
}

// Sombra no header ao rolar
const header = document.querySelector('header');
window.addEventListener('scroll',()=>{ const y = window.scrollY; header && (header.style.boxShadow = y > 4 ? 'var(--shadow)' : 'none'); }, {passive:true});

// Accordion simples (FAQ)
document.querySelectorAll('.faq-q').forEach(q=>{ q.addEventListener('click',()=> q.parentElement.classList.toggle('open')); });

// --- Chat mockup sequence ---
function startChatMock(selector){
  const root = document.querySelector(selector);
  if(!root) return;
  const body = root.querySelector('.chat-body');
  const typingTpl = () => {
    const el = document.createElement('div');
    el.className = 'row';
    el.innerHTML = `<div class="bubble bot typing"><span></span><span></span><span></span></div>`;
    return el;
  };
  const add = (type, text, opts={}) => {
    const row = document.createElement('div');
    row.className = 'row';
    const html = `<div class="bubble ${type}">${text}${opts.time?`<span class="time">${opts.time}</span>`:''}${opts.read?`<span class="read">✓✓</span>`:''}</div>`;
    row.innerHTML = html;
    body.appendChild(row);
    body.scrollTop = body.scrollHeight;
  };
  const steps = [
    {typing:1000, type:'bot', text:'Olá! Eu sou o <strong>ZeCash</strong> 🤖. Quer começar a organizar seus gastos agora?', time:'09:14'},
    {typing:800,  type:'user', text:'Quero sim! “almoço 35”', read:true, time:'09:14'},
    {typing:900,  type:'bot', text:'Anotado ✅ Categoria: <strong>Alimentação</strong>. Quer ver seu <em>resumo da semana</em>?', time:'09:15'},
    {typing:750,  type:'user', text:'Pode ser', read:true, time:'09:15'},
    {typing:1100, type:'bot', text:'Você gastou <strong>R$ 120</strong> em <strong>Delivery</strong> nesta semana — <strong>30% acima</strong> da sua média.', time:'09:15'},
    {typing:1200, type:'bot', text:'<strong>Parabéns!</strong> Este mês você gastou menos em <strong>transporte</strong> do que no mês passado 🎉.', time:'09:15'},
    {typing:900,  type:'bot', text:'Definir um <strong>limite mensal</strong> para Delivery? Posso avisar quando chegar perto.', time:'09:16'},
  ];
  let i = 0;
  const run = () => {
    if(i>=steps.length) return;
    const s = steps[i++];
    const t = typingTpl();
    body.appendChild(t);
    body.scrollTop = body.scrollHeight;
    setTimeout(()=>{
      body.removeChild(t);
      add(s.type, s.text, {time:s.time, read: s.read});
      run();
    }, s.typing);
  };
  run();
}
document.addEventListener('DOMContentLoaded', ()=> startChatMock('#chat-mock'));

// --- Revelar ao rolar (UX) ---
(function(){
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const selectors = [
    '.hero .badge','.hero h1','.hero .lead','.hero .actions',
    '.keypoints span','.phone','.mascot',
    'section','section .card','section .feature','section .step','section .benefit','section .testimonial','.price','.form'
  ];
  const toReveal = selectors.flatMap(sel => Array.from(document.querySelectorAll(sel)));
  toReveal.forEach(el => el.classList?.add('reveal'));
  document.querySelectorAll('.keypoints, .features, .steps, .benefits, .testimonials, .pricing, .faq').forEach(group=>{
    group.classList.add('stagger');
    [...group.children].forEach((child,i)=> child.style.setProperty('--st', (i*70)+'ms'));
  });
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, {threshold:0.12, rootMargin:'0px 0px -10% 0px'});
  toReveal.forEach(el => io.observe(el));
})();

// --- Parallax tilt seguro ---
(function(){
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const phoneEls = document.querySelectorAll('.phone');
  phoneEls.forEach(el=>{
    const onMove = (e)=>{
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width/2;
      const cy = r.top + r.height/2;
      const dx = (e.clientX - cx) / (r.width/2);
      const dy = (e.clientY - cy) / (r.height/2);
      el.classList.add('tilt');
      el.style.setProperty('--ry', (dx*6).toFixed(2)+'deg');
      el.style.setProperty('--rx', (-dy*6).toFixed(2)+'deg');
    };
    const reset = ()=>{
      el.style.removeProperty('--ry');
      el.style.removeProperty('--rx');
      el.classList.remove('tilt');
    };
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', reset);
    el.addEventListener('blur', reset);
  });
})();



/* ====== [ADDON] Sessão simples + Botão "Dashboard" com overlay ====== */
// Cria sessão mínima e redireciona após login/registro
document.addEventListener('submit', (e) => {
  const form = e.target.closest('form[data-auth]');
  if (!form) return;
  e.preventDefault();
  const nameEl = document.getElementById('name');
  const emailEl = document.getElementById('email');
  const user = { name: nameEl ? (nameEl.value || 'Cliente') : 'Cliente', email: emailEl ? (emailEl.value || '') : '' };
  localStorage.setItem('ux2_session', JSON.stringify({ user }));
  location.href = './ux2-dashboard.html';
});

// Botão "Dashboard" que abre overlay com iframe do dashboard
(function () {
  const DASH_SRC_DEFAULT = (document.documentElement.getAttribute('data-dashboard-src') || 'ux2-dashboard.html').trim();

  function ensureOverlay() {
    if (document.getElementById('ux2-dash-overlay')) return;
    const style = document.createElement('style');
    style.textContent = `
      #ux2-dash-overlay{position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(20,20,20,.8);backdrop-filter:saturate(120%) blur(4px);z-index:2147483000;padding:24px}
      #ux2-dash-card{width:min(1200px,96vw);height:min(90vh,920px);background:#ffffff;border-radius:20px;box-shadow:0 24px 80px rgba(0,0,0,.45);border:1px solid #e6e6e6;display:flex;flex-direction:column;overflow:hidden}
      #ux2-dash-header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #eef0f2;color:#111;font:600 14px/1.2 system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Helvetica Neue,Arial}
      #ux2-dash-title{display:flex;align-items:center;gap:.5rem}
      #ux2-dash-close{appearance:none;background:#f4f6f8;border:1px solid #e6eaee;border-radius:10px;color:#111;font-size:14px;cursor:pointer;padding:6px 10px}
      #ux2-dash-close:hover{background:#eef1f5}
      #ux2-dash-iframe{width:100%;height:100%;border:0;flex:1 1 auto;background:#fff}
      .btn-dashboard{display:inline-flex;align-items:center;gap:.5rem;padding:.6rem .9rem;border-radius:.75rem;border:1px solid #dfe6e9;background:#ffffff;color:#111;cursor:pointer;font-weight:600;transition:transform .04s ease, box-shadow .2s ease}
      .btn-dashboard:hover{box-shadow:0 8px 24px rgba(0,0,0,.08)}
      .btn-dashboard:active{transform:translateY(1px)}
    `;
    document.head.appendChild(style);

    const overlay = document.createElement('div');
    overlay.id = 'ux2-dash-overlay';
    overlay.innerHTML = `
      <div id="ux2-dash-card" role="dialog" aria-modal="true" aria-label="Dashboard">
        <div id="ux2-dash-header">
          <div id="ux2-dash-title"><span>Dashboard</span></div>
          <button id="ux2-dash-close" title="Fechar" aria-label="Fechar">Fechar</button>
        </div>
        <iframe id="ux2-dash-iframe" src=""></iframe>
      </div>
    `;
    document.body.appendChild(overlay);

    function close(){ overlay.style.display='none'; }
    overlay.addEventListener('click', (ev)=>{ if (ev.target===overlay) close(); });
    overlay.querySelector('#ux2-dash-close').addEventListener('click', close);
    document.addEventListener('keydown', (ev)=>{ if (ev.key==='Escape') close(); });

    const iframe = overlay.querySelector('#ux2-dash-iframe');
    function openOverlay(){
      overlay.style.display='flex';
      iframe.src = DASH_SRC_DEFAULT;
      let loaded = false;
      iframe.onload = () => { loaded = true; };
      setTimeout(()=>{ if(!loaded){ window.open(DASH_SRC_DEFAULT, '_blank'); } }, 1200);
    }
    overlay.openOverlay = openOverlay;
  }

  function injectButton() {
    ensureOverlay();
    const overlay = document.getElementById('ux2-dash-overlay');
    const menu = document.querySelector('.menu') || document.querySelector('nav .menu') || document.querySelector('nav') || document.querySelector('header');

    if (!document.querySelector('.btn-dashboard')) {
      const btn = document.createElement('button');
      btn.className = 'btn-dashboard';
      btn.type = 'button';
      btn.id = 'open-dashboard';
      btn.textContent = 'Dashboard';
      btn.addEventListener('click', () => overlay.openOverlay());

      if (menu) {
        menu.appendChild(btn);
      } else {
        const wrap = document.createElement('div');
        wrap.style = 'position:fixed; right:16px; bottom:16px; z-index:2147483001;';
        wrap.appendChild(btn);
        document.body.appendChild(wrap);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectButton, { once: true });
  } else {
    injectButton();
  }
})();
