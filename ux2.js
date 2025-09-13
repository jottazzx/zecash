// Helpers
const fmt = (v)=> v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const catsBase=['Alimentação','Transporte','Moradia','Lazer','Saúde','Educação','Mercado','Delivery','Outros'];

function seed(days=240){
  const tx=[]; const start=new Date(); start.setDate(start.getDate()-days);
  for(let d=0; d<days; d++){
    const day = new Date(start); day.setDate(start.getDate()+d);
    const n = Math.random()<0.5?0:(Math.random()<0.8?1:2);
    for(let i=0;i<n;i++){
      const cat = catsBase[Math.floor(Math.random()*catsBase.length)];
      const base = ({Alimentação:28,Transporte:15,Moradia:48,Lazer:26,Saúde:25,Educação:32,Mercado:65,Delivery:40,Outros:22})[cat];
      const val = Math.max(5, base*(0.55+Math.random()*1.5));
      tx.push({date:day.toISOString().slice(0,10), value:+val.toFixed(2), cat, desc:`${cat} ${i+1}`});
    }
  }
  return tx;
}
function load(){ return JSON.parse(localStorage.getItem('ux2_session')||'null'); }
function save(s){ localStorage.setItem('ux2_session', JSON.stringify(s)); }

// Legacy login handler kept for compatibility (not used)
window.ux2Login=(e)=>{
  if(e) e.preventDefault();
  const name='Visitante';
  const budget=2500;
  const email='';
  const goals=[];
  save({user:{name,email}, budget, goals, txs:seed(360)});
  location.href='./ux2-dashboard.html';
  return false;
};

// SVG charts
function drawBars(svg, data, {padding=24}={}){
  const w=svg.clientWidth, h=svg.clientHeight;
  svg.setAttribute('viewBox',`0 0 ${w} ${h}`); svg.innerHTML='';
  const max=Math.max(...data.map(d=>d.value),1);
  const barW=(w-padding*2)/data.length;
  data.forEach((d,i)=>{
    const x=padding + i*barW + 8;
    const bh=(d.value/max)*(h-padding*2);
    const y=h-padding-bh;
    const r=document.createElementNS('http://www.w3.org/2000/svg','rect');
    r.setAttribute('x',x); r.setAttribute('y',y); r.setAttribute('width',barW-16); r.setAttribute('height',bh); r.setAttribute('rx',8);
    r.setAttribute('fill','var(--brand-600)'); svg.appendChild(r);
    const lab=document.createElementNS('http://www.w3.org/2000/svg','text');
    lab.setAttribute('x', x+(barW-16)/2); lab.setAttribute('y', h-padding+12); lab.setAttribute('font-size','11'); lab.setAttribute('text-anchor','middle'); lab.setAttribute('fill','var(--muted)');
    lab.textContent=d.label; svg.appendChild(lab);
  });
}
function drawLine(svg, points, {padding=24}={}){
  const w=svg.clientWidth, h=svg.clientHeight;
  svg.setAttribute('viewBox',`0 0 ${w} ${h}`); svg.innerHTML='';
  const max=Math.max(...points,1);
  const step=(w-padding*2)/(points.length-1);
  const pts=points.map((v,i)=>`${padding+i*step},${(h-padding)-(v/max)*(h-padding*2)}`).join(' ');
  const poly=document.createElementNS('http://www.w3.org/2000/svg','polyline');
  poly.setAttribute('points',pts); poly.setAttribute('fill','none'); poly.setAttribute('stroke','var(--brand-600)'); poly.setAttribute('stroke-width','3'); poly.setAttribute('stroke-linecap','round');
  svg.appendChild(poly);
}
function drawDonut(svg, percent){
  svg.innerHTML='';
  const cx=100,cy=100,r=70,c=2*Math.PI*r;
  const bg=document.createElementNS('http://www.w3.org/2000/svg','circle');
  bg.setAttribute('cx',cx); bg.setAttribute('cy',cy); bg.setAttribute('r',r); bg.setAttribute('fill','none'); bg.setAttribute('stroke','#eef5f1'); bg.setAttribute('stroke-width','18'); svg.appendChild(bg);
  const fg=document.createElementNS('http://www.w3.org/2000/svg','circle');
  fg.setAttribute('cx',cx); fg.setAttribute('cy',cy); fg.setAttribute('r',r); fg.setAttribute('fill','none'); fg.setAttribute('stroke','var(--brand-600)');
  fg.setAttribute('stroke-width','18'); fg.setAttribute('stroke-linecap','round'); fg.setAttribute('stroke-dasharray',`${c*percent} ${c}`); fg.setAttribute('transform','rotate(-90 100 100)'); svg.appendChild(fg);
  const txt=document.createElementNS('http://www.w3.org/2000/svg','text');
  txt.setAttribute('x',cx); txt.setAttribute('y',cy-2); txt.setAttribute('text-anchor','middle'); txt.setAttribute('font-size','22'); txt.setAttribute('font-weight','900'); txt.textContent=Math.round(percent*100)+'%'; svg.appendChild(txt);
  const sub=document.createElementNS('http://www.w3.org/2000/svg','text');
  sub.setAttribute('x',cx); sub.setAttribute('y',cy+16); sub.setAttribute('text-anchor','middle'); sub.setAttribute('fill','var(--muted)'); sub.setAttribute('font-size','12'); sub.textContent='do orçamento'; svg.appendChild(sub);
}

// Dashboard
function ready(fn){ document.readyState!=='loading'?fn():document.addEventListener('DOMContentLoaded',fn); }

ready(()=>{
  const page = location.pathname.split('/').pop();
  if(page==='ux2-dashboard.html'){
    // Garantir sessão fictícia por padrão
    let sess=load();
    if(!sess){
      sess = { user:{name:'Visitante', email:''}, budget:2500, goals:[], txs:seed(360) };
      save(sess);
    }

    const exportBtn=document.getElementById('exportCsv');
    if (exportBtn){
      exportBtn.addEventListener('click',(e)=>{
        e.preventDefault();
        const rows=sess.txs;
        if(!rows.length){ alert('Sem dados.'); return; }
        const header=Object.keys(rows[0]);
        const csv=[header.join(',')].concat(rows.map(r=>header.map(h=>JSON.stringify(r[h])).join(','))).join('\n');
        const blob=new Blob([csv],{type:'text/csv'}); const url=URL.createObjectURL(blob);
        const a=document.createElement('a'); a.href=url; a.download='zecash-dados.csv'; a.click(); URL.revokeObjectURL(url);
      });
    }

    // Não há botão de sair; tolerar se existir em versões antigas
    const logout=document.getElementById('logout');
    if(logout){
      logout.addEventListener('click',(e)=>{ e.preventDefault(); localStorage.removeItem('ux2_session'); alert('Login removido. Dados fictícios serão recriados no próximo acesso.'); });
    }

    const name=sess.user.name||'você';
    document.getElementById('welcomeTitle').textContent=`Bem-vindo(a), ${name}!`;
    const now=new Date();
    document.getElementById('welcomeSub').textContent=`Hoje é ${now.toLocaleDateString('pt-BR')} · Orçamento: ${fmt(sess.budget)}`;

    const pillWrap=document.getElementById('pillGoals');
    const renderPills=()=>{
      pillWrap.innerHTML = (sess.goals||[]).slice(0,4).map(g=>`<span class="pill">${g.cat}: ${fmt(g.limit)}</span>`).join('') || '<span class="pill">Sem metas definidas</span>';
    };
    renderPills();
    document.getElementById('setGoal').addEventListener('click',()=>{
      const cat=prompt('Categoria para meta (ex.: Mercado, Transporte)')||'Outros';
      const lim=Number(prompt('Limite mensal (R$)')||'0');
      if(!lim) return;
      sess.goals = sess.goals || [];
      sess.goals.push({cat, limit:lim});
      save(sess);
      renderPills();
      alert('Meta adicionada!');
    });

    const periodSel=document.getElementById('periodSelect');
    function render(){
      const days=Number(periodSel.value);
      const cutoff=new Date(); cutoff.setDate(cutoff.getDate()-days);
      const tx=sess.txs.filter(t=> new Date(t.date) >= cutoff);

      const currMonth=new Date().toISOString().slice(0,7);
      const prevMonth=new Date(new Date().setMonth(new Date().getMonth()-1)).toISOString().slice(0,7);
      const sumMonth=(m)=> tx.filter(t=>t.date.startsWith(m)).reduce((a,b)=>a+b.value,0);
      const valCurr=sumMonth(currMonth), valPrev=sumMonth(prevMonth);
      const mom=valPrev?((valCurr-valPrev)/valPrev):0;
      document.getElementById('kpiMonthSpend').textContent=fmt(valCurr);
      document.getElementById('kpiBudget').textContent=fmt(sess.budget);
      document.getElementById('kpiMoM').textContent=(mom>=0?'+':'')+(mom*100).toFixed(1)+'%';
      const last14=[];
      for(let i=13;i>=0;i--){ const d=new Date(); d.setDate(d.getDate()-i); const day=d.toISOString().slice(0,10); last14.push(tx.filter(t=>t.date===day).reduce((a,b)=>a+b.value,0)); }
      drawLine(document.getElementById('sparkMoM'), last14, {padding:6});

      const byCat={}; tx.forEach(t=> byCat[t.cat]=(byCat[t.cat]||0)+t.value);
      const top=Object.entries(byCat).sort((a,b)=>b[1]-a[1])[0]||['—',0];
      document.getElementById('kpiTopCat').textContent=top[0];
      document.getElementById('kpiTopCatTip').textContent=fmt(top[1])+' no período';

      // Economia estimada: 15% no top 2
      const sorted=Object.entries(byCat).sort((a,b)=>b[1]-a[1]);
      const saveEst = (sorted[0]?sorted[0][1]*0.15:0) + (sorted[1]?sorted[1][1]*0.15:0);
      document.getElementById('kpiSave').textContent=fmt(saveEst);

      const catsData=sorted.slice(0,6).map(([label,value])=>({label,value}));
      drawBars(document.getElementById('chartCats'), catsData);
      document.getElementById('legendCats').innerHTML=catsData.map(c=>`<span>${c.label}: <strong>${fmt(c.value)}</strong></span>`).join('');

      const monthTx=sess.txs.filter(t=>t.date.startsWith(currMonth));
      const totalMonth=monthTx.reduce((a,b)=>a+b.value,0);
      const pct=clamp(totalMonth/Math.max(1,sess.budget),0,1);
      drawDonut(document.getElementById('chartDonut'), pct);
      document.getElementById('budgetProgress').style.width=(pct*100).toFixed(1)+'%';

      const last30=[];
      for(let i=29;i>=0;i--){ const d=new Date(); d.setDate(d.getDate()-i); const day=d.toISOString().slice(0,10); last30.push(sess.txs.filter(t=>t.date===day).reduce((a,b)=>a+b.value,0)); }
      var dates30=[]; for(let i=29;i>=0;i--){ const d=new Date(); d.setDate(d.getDate()-i); dates30.push(d.toISOString().slice(0,10)); } drawDailyEnhanced(document.getElementById('chartDaily'), last30, dates30);

      // Sugestões
      const coach=document.getElementById('coachList');
      const hints=[
        `Você gastou mais em ${top[0]} este mês. Que tal definir uma meta 15% menor para a categoria?`,
        `Considere revisar suas assinaturas recorrentes: streaming, academia e internet.`,
        `Faça uma "semana sem delivery" — sua economia pode chegar a ${fmt(Math.round((byCat['Delivery']||0)*0.25))}.`,
        `Registre gastos diariamente. Dias ativos recentes: ${new Set(tx.map(t=>t.date)).size}.`
      ];
      coach.innerHTML = hints.map(h=>`<div class="row"><div>${h}</div><button class="btn btn-ghost" onclick="alert('OK! Vamos lembrar disso.');">Aplicar</button></div>`).join('');

      // Tabela — últimas 12 transações
      const table=document.getElementById('txTable');
      const last=tx.slice(-12).reverse();
      table.innerHTML='<tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Valor</th></tr>' + last.map(t=>`<tr><td>${new Date(t.date).toLocaleDateString('pt-BR')}</td><td>${t.desc}</td><td>${t.cat}</td><td>${fmt(t.value)}</td></tr>`).join('');
    }
    periodSel.addEventListener('change', render);
    document.getElementById('addExpense').addEventListener('click',()=>{
      const cat=prompt('Categoria')||'Outros'; const val=Number(prompt('Valor (R$)')||'0'); if(!val) return;
      const desc=prompt('Descrição')||cat; const today=new Date().toISOString().slice(0,10);
      sess.txs.push({date:today,value:val,cat,desc}); save(sess); alert('Gasto adicionado!'); render();
    });
    document.querySelectorAll('.reveal').forEach((el,i)=>{ setTimeout(()=>el.classList.add('in'), 70*i); });
    render();
  }
});


function drawDailyEnhanced(svg, values, dates){
  const padding=32;
  const w=svg.clientWidth, h=svg.clientHeight;
  svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
  svg.innerHTML='';
  const max=Math.max(...values,1);
  const step=(w-padding*2)/(values.length-1);

  // grid (y ticks 0, 25%, 50%, 75%, 100%)
  for(let i=0;i<=4;i++){
    const y = (h-padding) - (i/4)*(h-padding*2);
    const line = document.createElementNS('http://www.w3.org/2000/svg','line');
    line.setAttribute('x1', padding); line.setAttribute('x2', w-padding);
    line.setAttribute('y1', y); line.setAttribute('y2', y);
    line.setAttribute('class','grid-line');
    svg.appendChild(line);
    const lab = document.createElementNS('http://www.w3.org/2000/svg','text');
    lab.setAttribute('x', padding-6); lab.setAttribute('y', y+4);
    lab.setAttribute('text-anchor','end'); lab.setAttribute('class','axis-label');
    lab.textContent = (max*(i/4)).toFixed(0);
    svg.appendChild(lab);
  }

  // x-axis labels (every 7 days)
  for(let i=0;i<dates.length;i+=7){
    const x = padding + i*step;
    const lab = document.createElementNS('http://www.w3.org/2000/svg','text');
    lab.setAttribute('x', x); lab.setAttribute('y', h - padding + 16);
    lab.setAttribute('text-anchor','middle'); lab.setAttribute('class','axis-label');
    const d = new Date(dates[i]);
    lab.textContent = d.toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'});
    svg.appendChild(lab);
  }

  // Area under the daily line
  const pts = values.map((v,i)=>`${padding+i*step},${(h-padding)-(v/max)*(h-padding*2)}`).join(' ');
  const areaPts = `${padding},${h-padding} ` + pts + ` ${w-padding},${h-padding}`;
  const area = document.createElementNS('http://www.w3.org/2000/svg','polygon');
  area.setAttribute('points', areaPts);
  area.setAttribute('fill','rgba(16,185,129,.15)');
  svg.appendChild(area);

  // Main line
  const poly = document.createElementNS('http://www.w3.org/2000/svg','polyline');
  poly.setAttribute('points', pts);
  poly.setAttribute('fill','none');
  poly.setAttribute('stroke','var(--brand-600)');
  poly.setAttribute('stroke-width','3');
  poly.setAttribute('stroke-linecap','round');
  svg.appendChild(poly);

  // 7-day moving average
  const avg = values.map((_,i)=>{
    const start = Math.max(0, i-6);
    const slice = values.slice(start, i+1);
    return slice.reduce((a,b)=>a+b,0)/slice.length;
  });
  const avgPts = avg.map((v,i)=>`${padding+i*step},${(h-padding)-(v/max)*(h-padding*2)}`).join(' ');
  const avgLine = document.createElementNS('http://www.w3.org/2000/svg','polyline');
  avgLine.setAttribute('points', avgPts);
  avgLine.setAttribute('fill','none');
  avgLine.setAttribute('stroke','#0ea5e9'); // teal-blue
  avgLine.setAttribute('stroke-width','2');
  avgLine.setAttribute('stroke-dasharray','4 4');
  svg.appendChild(avgLine);

  // Today marker (last point)
  const todayX = padding + (values.length-1)*step;
  const todayLine = document.createElementNS('http://www.w3.org/2000/svg','line');
  todayLine.setAttribute('x1', todayX); todayLine.setAttribute('x2', todayX);
  todayLine.setAttribute('y1', h-padding); todayLine.setAttribute('y2', padding-6);
  todayLine.setAttribute('stroke','#111827'); todayLine.setAttribute('stroke-width','1');
  todayLine.setAttribute('stroke-dasharray','3 3');
  svg.appendChild(todayLine);

  // Dots + tooltip
  const wrap = svg.parentElement;
  let tip = wrap.querySelector('.tooltip');
  if(!tip){ tip = document.createElement('div'); tip.className='tooltip'; wrap.appendChild(tip); }
  values.forEach((v,i)=>{
    const cx = padding + i*step;
    const cy = (h-padding)-(v/max)*(h-padding*2);
    const dot = document.createElementNS('http://www.w3.org/2000/svg','circle');
    dot.setAttribute('cx',cx); dot.setAttribute('cy',cy); dot.setAttribute('r',3.5);
    dot.setAttribute('fill','var(--brand-600)');
    dot.style.cursor='pointer';
    dot.addEventListener('mouseenter',()=>{
      tip.innerHTML = `<div><strong>${v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</strong></div><div>${new Date(dates[i]).toLocaleDateString('pt-BR')}</div>`;
      tip.style.display='block';
    });
    dot.addEventListener('mousemove',(e)=>{
      tip.style.left = (e.offsetX + 16) + 'px';
      tip.style.top  = (e.offsetY + 16) + 'px';
    });
    dot.addEventListener('mouseleave',()=>{ tip.style.display='none'; });
    svg.appendChild(dot);
  });
}


// === Fake data injection for dashboard (KPIs + Charts + Transactions + Daily Spend) ===
window.addEventListener("load", () => {
  const days = 30; // período inicial default
  const data = seed(days);  // gerar transações fake

  // ==== KPIs ====
  const total = data.reduce((sum, tx) => sum + tx.value, 0);
  const budget = 2500;
  document.getElementById("kpiMonthSpend").textContent = fmt(total);
  document.getElementById("kpiBudget").textContent = fmt(budget);
  document.getElementById("kpiMoM").textContent = "+12.5%";

  // categoria mais usada
  const grouped = {};
  data.forEach(tx => { grouped[tx.cat] = (grouped[tx.cat] || 0) + tx.value; });
  const sortedCats = Object.entries(grouped).sort((a,b)=>b[1]-a[1]);
  if(sortedCats.length){
    document.getElementById("kpiTopCat").textContent = sortedCats[0][0];
    document.getElementById("kpiTopCatTip").textContent = fmt(sortedCats[0][1]);
  }

  document.getElementById("kpiSave").textContent = fmt(300);
  document.getElementById("budgetProgress").style.width = "75%";
  document.getElementById("welcomeTitle").textContent = "Olá, João!";
  document.getElementById("welcomeSub").textContent = "Aqui está o seu painel com dados fictícios.";

  // ==== Charts ====
  // Gastos por categoria
  const catsData = Object.entries(grouped).map(([cat, value]) => ({label: cat, value}));
  if(typeof drawBars === "function"){
    drawBars(document.getElementById("chartCats"), catsData);
  }

  // Orçamento do mês
  const pct = total / budget;
  if(typeof drawDonut === "function"){
    drawDonut(document.getElementById("chartDonut"), pct);
  }

  // ==== Gasto diário ====
  if(typeof drawDailyEnhanced === "function"){
    const dates = [];
    const today = new Date();
    for(let i = days-1; i >= 0; i--){
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      dates.push(d.toISOString().slice(0,10));
    }
    // somar gastos por dia
    const dailyMap = {};
    data.forEach(tx => { dailyMap[tx.date] = (dailyMap[tx.date] || 0) + tx.value; });
    const last = dates.map(date => +(dailyMap[date] || 0).toFixed(2));
    drawDailyEnhanced(document.getElementById("chartDaily"), last, dates);
  }

  // ==== Transações recentes ====
  const tbody = document.querySelector("table tbody") || document.querySelector("#recentTxs");
  if(tbody){
    tbody.innerHTML = "";
    data.slice(-10).reverse().forEach(tx => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${tx.date}</td>
        <td>${tx.desc}</td>
        <td>${tx.cat}</td>
        <td>${fmt(tx.value)}</td>
      `;
      tbody.appendChild(tr);
    });
  }
});
