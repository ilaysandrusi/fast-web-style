import { useEffect, useRef } from 'react';

const Game = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameInitialized = useRef(false);

  useEffect(() => {
    if (gameInitialized.current) return;
    gameInitialized.current = true;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // =====================
    // Game Content
    // =====================
    const CONTENT = {
      candidate: {
        name: 'Your Name',
        title: 'Web Developer',
        about: 'A passionate developer creating immersive web experiences with modern technologies and gaming-inspired aesthetics.',
      },
      skills: ['React','TypeScript','JavaScript', 'Tailwind CSS', 'Node.js', 'Next.js', 'HTML5 Canvas', 'WebGL', 'Three.js', 'Animation', 'Game Development', 'UI/UX Design', 'Performance Optimization'],
      projects: [
        {name:'Gaming Portfolio', url:'#', note:'Interactive resume game built with HTML5 Canvas, featuring physics-based gameplay and smooth animations.'},
        {name:'Web App Dashboard', url:'#', note:'Modern React dashboard with dark theme, real-time data visualization, and responsive design.'},
      ],
      links: [
        {label:'GitHub', url:'https://github.com'},
        {label:'LinkedIn', url:'https://linkedin.com'},
        {label:'Portfolio', url:'#'},
        {label:'Email', url:'mailto:hello@example.com'},
      ],
    };

    // =====================
    // Game Setup
    // =====================
    const stageBadge = document.getElementById('stageBadge');
    const timeBadge = document.getElementById('timeBadge');
    const hintBadge = document.getElementById('hintBadge');
    const menu = document.getElementById('menu');
    const pause = document.getElementById('pause');
    const panel = document.getElementById('panel');
    const panelContent = document.getElementById('panelContent');
    const finish = document.getElementById('finish');
    const summary = document.getElementById('summary');
    const finishLinks = document.getElementById('finishLinks');
    const quickLinks = document.getElementById('quickLinks');
    const startBtn = document.getElementById('startBtn');
    const howBtn = document.getElementById('howBtn');
    const resumeBtn = document.getElementById('resumeBtn');
    const restartBtn = document.getElementById('restartBtn');
    const shareBtn = document.getElementById('shareBtn');
    const shareFallback = document.getElementById('shareFallback');
    const shareText = document.getElementById('shareText');
    const toast = document.getElementById('toast');
    const yearSpan = document.getElementById('year');
    
    if (yearSpan) yearSpan.textContent = new Date().getFullYear().toString();

    // Physics constants
    const W = canvas.width, H = canvas.height;
    const GROUND_H = 64;
    const gravity = 2000;
    const moveSpeed = 300;
    const jumpVy = -600;

    const stages = [
      {name:'About', start:0, len:1400, difficulty:0},
      {name:'Skills', start:1400, len:1600, difficulty:1},
      {name:'Projects', start:3000, len:1800, difficulty:2},
      {name:'Links', start:4800, len:1200, difficulty:3},
    ];
    const lastStage = stages[stages.length-1];
    const WORLD_LEN = lastStage.start + lastStage.len + 400;

    // Game entities
    const platforms: any[] = [];
    const movers: any[] = [];
    const enemies: any[] = [];
    const interactors: any[] = [];
    const hazards: any[] = [];

    // Player & camera
    const player = { x:80, y:H-GROUND_H-40, w:28, h:40, vx:0, vy:0, onGround:false, canInteract:false };
    let camX = 0;
    let checkpointX = 80;
    let keys: any = {};
    let tPrev = 0;
    let totalTime = 0;
    let playing = false;
    let isPaused = false;
    let finished = false;

    // Helper functions
    const rectsOverlap = (a: any, b: any) => (a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y);
    const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
    const fmtTime = (s: number) => {
      const m = Math.floor(s/60);
      const ss = Math.floor(s%60).toString().padStart(2,'0');
      return `${m}:${ss}`;
    };

    // World building functions
    function addGround(x: number, w: number) {
      if(w <= 0) return;
      platforms.push({x, y:H-GROUND_H, w, h:GROUND_H, type:'ground'});
    }

    function groundWithGaps(stage: any, gaps: any[]) {
      const start = stage.start, end = stage.start + stage.len;
      const arr = (gaps || []).slice().sort((a: any, b: any) => a.x - b.x);
      let cursor = start;
      for(const g of arr) {
        addGround(cursor, Math.max(0, g.x - cursor));
        cursor = Math.max(cursor, g.x + g.w);
      }
      addGround(cursor, Math.max(0, end - cursor));
    }

    const gap = (x: number, w: number) => ({x, w});
    const sign = (x: number, label: string) => ({ kind:'sign', label, x, y:H-GROUND_H-40, w:20, h:40, seen:false });
    const finishGate = (x: number) => ({ kind:'finish', x, y:H-GROUND_H-80, w:30, h:80 });
    const movingPlatform = (x: number, y: number, w: number, h: number, dx: number, dy: number) => ({ x, y, w, h, t:0, amp:dy, baseY:y, type:'mover' });
    const bug = (x: number, y: number, patrol = 160) => ({ x, y, w:26, h:24, dir:1, left:x, right:x+patrol, type:'bug' });
    const blocker = (x: number, y: number, w: number, h: number) => ({ x, y, w, h, type:'hazard' });

    function buildWorld() {
      platforms.length = 0;
      movers.length = 0;
      enemies.length = 0;
      interactors.length = 0;
      hazards.length = 0;
      
      // Extra ground under final flag
      platforms.push({
        x: WORLD_LEN - 300,
        y: H - GROUND_H,
        w: 400,
        h: GROUND_H,
        type: 'ground'
      });

      // Stage 1: flat intro + one simple blocker
      groundWithGaps(stages[0], []);
      interactors.push(sign(stages[0].start+300, 'About'));
      hazards.push(blocker(stages[0].start+600, H-GROUND_H-22, 30, 22));

      // Stage 2: two gaps + ledge + small blocker
      groundWithGaps(stages[1], [gap(stages[1].start+420, 80), gap(stages[1].start+900, 120)]);
      platforms.push({x:stages[1].start+1200, y:H-GROUND_H-60, w:220, h:20, type:'ledge'});
      interactors.push(sign(stages[1].start+250, 'Skills'));
      hazards.push(blocker(stages[1].start+1050, H-GROUND_H-24, 36, 24));

      // Stage 3: larger pit with moving platform + enemy + blocker
      groundWithGaps(stages[2], [gap(stages[2].start+380, 140)]);
      movers.push(movingPlatform(stages[2].start+430, H-GROUND_H-80, 120, 18, 0, 40));
      enemies.push(bug(stages[2].start+1100, H-GROUND_H-24, 180));
      platforms.push({x:stages[2].start+1350, y:H-GROUND_H-80, w:180, h:20, type:'ledge'});
      interactors.push(sign(stages[2].start+260, 'Projects'));
      hazards.push(blocker(stages[2].start+1520, H-GROUND_H-28, 44, 28));

      // Stage 4: tighter jumps + finish
      groundWithGaps(stages[3], [gap(stages[3].start+360, 90), gap(stages[3].start+720, 110)]);
      interactors.push(sign(stages[3].start+120, 'Links'));
      interactors.push(finishGate(WORLD_LEN-160));
      hazards.push(blocker(stages[3].start+260, H-GROUND_H-26, 34, 26));
      hazards.push(blocker(stages[3].start+540, H-GROUND_H-30, 40, 30));
    }

    // UI functions
    function setStageBadge() {
      const st = currentStage();
      if (stageBadge) stageBadge.textContent = `Stage: ${st.index+1}/4 – ${st.name}`;
    }

    function currentStage() {
      for(let i = stages.length-1; i >= 0; i--) {
        if(player.x >= stages[i].start) return {index:i, name:stages[i].name};
      }
      return {index:0, name:stages[0].name};
    }

    function openPanelFor(label: string) {
      const htmlMap: any = {
        'About': `
          <h2>About – ${CONTENT.candidate.name}</h2>
          <p style="opacity:.85">${CONTENT.candidate.title}</p>
          <p>${CONTENT.candidate.about}</p>
          <div class="btns" style="margin-top:12px"><button class="secondary" id="closePanel">Close</button></div>
        `,
        'Skills': `
          <h2>Skills</h2>
          <div class="list">${CONTENT.skills.map(s=>`<span class='pill'>${s}</span>`).join('')}</div>
          <div class="btns" style="margin-top:12px"><button class="secondary" id="closePanel">Close</button></div>
        `,
        'Projects': `
          <h2>Projects</h2>
          <div>${CONTENT.projects.map(p=>`<p><strong>${p.name}</strong> – ${p.note} ${p.url&&p.url!=='#'?`<a class='link' href='${p.url}' target='_blank' rel='noopener'>Open</a>`:''}</p>`).join('')}</div>
          <div class="btns" style="margin-top:12px"><button class="secondary" id="closePanel">Close</button></div>
        `,
        'Links': `
          <h2>Links</h2>
          <div class="btns">${CONTENT.links.map(l=>`<a href='${l.url}' target='_blank' rel='noopener'><button>${l.label}</button></a>`).join('')}</div>
          <div class="btns" style="margin-top:12px"><button class="secondary" id="closePanel">Close</button></div>
        `,
      };
      if (panelContent) {
        panelContent.innerHTML = htmlMap[label] || `<h2>${label}</h2>`;
        if (panel) panel.hidden = false;
        const closeBtn = document.getElementById('closePanel');
        if (closeBtn) closeBtn.onclick = () => { if (panel) panel.hidden = true; };
      }
    }

    function buildQuickLinks() {
      if (quickLinks) {
        quickLinks.innerHTML = CONTENT.links.map(l=>`<a href='${l.url}' target='_blank' rel='noopener'><button>${l.label}</button></a>`).join('');
      }
    }

    function showFinish() {
      finished = true;
      playing = false;
      isPaused = false;
      if (finish) finish.hidden = false;
      if (pause) pause.hidden = true;
      if (panel) panel.hidden = true;
      const st = fmtTime(totalTime);
      if (summary) summary.textContent = `Completed 4/4 stages in ${st}.`;
      if (finishLinks) {
        finishLinks.innerHTML = CONTENT.links.map(l=>`<a href='${l.url}' target='_blank' rel='noopener'><button>${l.label}</button></a>`).join('');
      }
    }

    async function shareSummary() {
      const text = `${CONTENT.candidate.name} – ${CONTENT.candidate.title}\nCompleted the Interactive Resume Game in ${fmtTime(totalTime)}.`;
      try {
        if (navigator.share) {
          await navigator.share({text});
          return true;
        }
        const textarea = shareText as HTMLTextAreaElement;
        if (textarea) {
          textarea.value = text;
          if (shareFallback) shareFallback.style.display = 'block';
          textarea.focus();
          textarea.select();
        }
        showToast('Copy the text above manually');
        return false;
      } catch(err) {
        const textarea = shareText as HTMLTextAreaElement;
        if (textarea) {
          textarea.value = text;
          if (shareFallback) shareFallback.style.display = 'block';
          textarea.focus();
          textarea.select();
        }
        showToast('Copy the text above manually');
        return false;
      }
    }

    let toastTimer: any = null;
    function showToast(msg: string) {
      if (toast) {
        toast.textContent = msg;
        toast.style.display = 'block';
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
          if (toast) toast.style.display = 'none';
        }, 1600);
      }
    }

    // Input handling
    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.code] = true;
      if (e.code === 'Escape') togglePause();
      if (e.code === 'KeyE') {
        if (player.canInteract) {
          const nearby = interactors.find(it => 
            (it.kind === 'sign' && Math.abs((it.x + it.w/2) - (player.x + player.w/2)) < 40)
          );
          if (nearby) openPanelFor(nearby.label);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };

    function togglePause() {
      if (!playing || finished) return;
      isPaused = !isPaused;
      if (pause) pause.hidden = !isPaused;
    }

    // Button event handlers
    const handleStart = () => {
      if (menu) menu.hidden = true;
      reset();
      playing = true;
    };

    const handleHow = () => {
      alert('Controls:\n• Left/Right: move\n• Space: jump\n• E: interact near glowing signs\n• Esc: pause');
    };

    const handleResume = () => togglePause();

    const handleRestart = () => {
      location.reload();
    };

    const handleShare = () => {
      shareSummary();
    };

    function reset() {
      player.x = 80;
      player.y = H - GROUND_H - 40;
      player.vx = 0;
      player.vy = 0;
      player.onGround = false;
      player.canInteract = false;
      camX = 0;
      totalTime = 0;
      tPrev = 0;
      finished = false;
      playing = true;
      isPaused = false;
      checkpointX = 80;
      buildWorld();
      setStageBadge();
    }

    function updateCheckpoint() {
      const st = currentStage();
      const target = stages[st.index].start + 40;
      if (target > checkpointX) checkpointX = target;
    }

    function respawn(msg?: string) {
      showToast(msg || 'Respawn');
      totalTime += 1.2;
      player.x = checkpointX;
      player.y = H - GROUND_H - player.h;
      player.vx = 0;
      player.vy = 0;
    }

    // Physics update
    function update(dt: number) {
      const wantLeft = keys['ArrowLeft'] || keys['KeyA'];
      const wantRight = keys['ArrowRight'] || keys['KeyD'];
      const wantJump = keys['Space'] || keys['ArrowUp'] || keys['PgUp'];

      if (wantLeft) player.vx = -moveSpeed;
      else if (wantRight) player.vx = moveSpeed;
      else {
        const sign = Math.sign(player.vx);
        const mag = Math.max(0, Math.abs(player.vx) - 900*dt);
        player.vx = sign*mag;
        if (Math.abs(player.vx) < 1) player.vx = 0;
      }

      if (wantJump && player.onGround) {
        player.vy = jumpVy;
        player.onGround = false;
      }

      player.vy += gravity*dt;
      if (player.vy > 1200) player.vy = 1200;

      // Move X
      player.x += player.vx*dt;
      for(const p of platforms) {
        const a = {x:player.x, y:player.y, w:player.w, h:player.h};
        if (rectsOverlap(a, p)) {
          if (player.vx > 0) {
            player.x = p.x - player.w;
            player.vx = 0;
          } else if (player.vx < 0) {
            player.x = p.x + p.w;
            player.vx = 0;
          }
        }
      }

      // Update movers
      for(const m of movers) {
        m.t += dt;
        m.y = m.baseY + Math.sin(m.t*1.2)*m.amp;
      }

      // Move Y
      player.y += player.vy*dt;
      player.onGround = false;
      for(const p of [...platforms, ...movers]) {
        const a = {x:player.x, y:player.y, w:player.w, h:player.h};
        if (rectsOverlap(a, p)) {
          if (player.vy > 0) {
            player.y = p.y - player.h;
            player.vy = 0;
            player.onGround = true;
          } else if (player.vy < 0) {
            player.y = p.y + p.h;
            player.vy = 0;
          }
        }
      }

      // Enemies
      for (let i = enemies.length - 1; i >= 0; i--) {
        const b = enemies[i];
        b.x += b.dir * 60 * dt;
        if (b.x < b.left || b.x > b.right) b.dir *= -1;

        if (rectsOverlap(player, b)) {
          if (player.vy > 100 && player.y + b.h - 6 <= b.y) {
            enemies.splice(i, 1);
            showToast('Bug squashed!');
            player.vy = jumpVy * 0.7;
          } else {
            respawn('Hit by enemy!');
          }
        }
      }

      // Hazards
      for(const h of hazards) {
        if (rectsOverlap(player, h)) {
          respawn('Hit hazard!');
          break;
        }
      }

      // Pits
      if (player.y > H) {
        respawn('Fell into pit!');
        return;
      }

      // Finish
      if (player.x > WORLD_LEN - 180) {
        showFinish();
      }

      // Camera + UI
      camX = clamp(player.x - W*0.35, 0, WORLD_LEN - W);
      const near = interactors.some(it => 
        it.kind === 'sign' && Math.abs((it.x + it.w/2) - (player.x + player.w/2)) < 40
      );
      player.canInteract = near;
      setStageBadge();
      updateCheckpoint();
    }

    // Draw function
    function draw() {
      ctx.clearRect(0, 0, W, H);
      
      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, H);
      gradient.addColorStop(0, '#0f172a');
      gradient.addColorStop(1, '#0b1324');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, W, H);
      
      // Stars
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#22d3ee';
      for(let i = 0; i < 40; i++) {
        const x = ((i*200 - camX*0.2) % W + W) % W;
        const y = (i*53) % H;
        ctx.fillRect(x, y, 2, 2);
      }
      ctx.globalAlpha = 1;

      // World
      ctx.save();
      ctx.translate(-camX, 0);
      
      // Platforms
      for(const p of platforms) {
        ctx.fillStyle = p.type === 'ground' ? '#1f2937' : '#374151';
        ctx.fillRect(p.x, p.y, p.w, p.h);
        if (p.type === 'ledge') {
          ctx.shadowColor = '#22d3ee';
          ctx.shadowBlur = 10;
          ctx.fillRect(p.x, p.y, p.w, p.h);
          ctx.shadowBlur = 0;
        }
      }
      
      // Moving platforms
      for(const m of movers) {
        ctx.shadowColor = '#a78bfa';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#6366f1';
        ctx.fillRect(m.x, m.y, m.w, m.h);
        ctx.shadowBlur = 0;
      }
      
      // Interactive elements
      for(const s of interactors) {
        if (s.kind === 'sign') drawSign(s);
        if (s.kind === 'finish') drawGate(s);
      }
      
      // Enemies
      for(const b of enemies) {
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.shadowBlur = 0;
      }
      
      // Hazards
      for(const hz of hazards) drawSpikes(hz);
      
      // Player
      ctx.shadowColor = '#22d3ee';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(player.x, player.y, player.w, player.h);
      ctx.shadowBlur = 0;
      
      ctx.restore();

      // Update HUD
      if (timeBadge) timeBadge.textContent = `Time: ${fmtTime(totalTime)}`;
      if (hintBadge) {
        hintBadge.textContent = player.canInteract ? 
          'Press E to open panel' : 
          'Arrows: move • Space: jump • E: interact • Esc: pause';
      }
    }

    function drawSign(s: any) {
      ctx.fillStyle = '#64748b';
      ctx.fillRect(s.x, s.y, s.w, s.h);
      ctx.shadowColor = '#22d3ee';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(s.x-6, s.y-16, s.w+12, 12);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 2;
      ctx.strokeRect(s.x-8, s.y-18, s.w+16, 16);
    }

    function drawGate(g: any) {
      ctx.shadowColor = '#a78bfa';
      ctx.shadowBlur = 25;
      ctx.fillStyle = '#7c3aed';
      ctx.fillRect(g.x, g.y, g.w, g.h);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(g.x-8, g.y-8, g.w+16, 6);
    }

    function drawSpikes(h: any) {
      const spikes = Math.max(1, Math.floor(h.w/12));
      ctx.fillStyle = '#dc2626';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 8;
      for(let i = 0; i < spikes; i++) {
        const sx = h.x + i*(h.w/spikes);
        const w = h.w/spikes;
        ctx.beginPath();
        ctx.moveTo(sx, h.y+h.h);
        ctx.lineTo(sx+w/2, h.y);
        ctx.lineTo(sx+w, h.y+h.h);
        ctx.closePath();
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    }

    // Game loop
    function loop(ts: number) {
      if (!tPrev) tPrev = ts;
      const dt = Math.min(0.03, (ts-tPrev)/1000);
      tPrev = ts;
      
      if (playing && !isPaused && !finished) {
        totalTime += dt;
        update(dt);
      }
      
      draw();
      requestAnimationFrame(loop);
    }

    // Event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Button listeners
    if (startBtn) startBtn.onclick = handleStart;
    if (howBtn) howBtn.onclick = handleHow;
    if (resumeBtn) resumeBtn.onclick = handleResume;
    if (restartBtn) restartBtn.onclick = handleRestart;
    if (shareBtn) shareBtn.onclick = handleShare;

    // Initialize
    buildQuickLinks();
    buildWorld();
    setStageBadge();
    requestAnimationFrame(loop);

    console.log('🎮 Game initialized successfully!');

    // Cleanup function
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };

  }, []);

  return (
    <div id="wrap" className="relative grid place-items-center h-screen">
      <canvas 
        ref={canvasRef}
        id="game" 
        width="960" 
        height="540"
        className="w-full max-w-[980px] h-auto max-h-[552px] aspect-[16/9] block rounded-[18px] shadow-[0_18px_60px_rgba(0,0,0,0.5),inset_0_0_0_1px_rgba(255,255,255,0.06)] border border-white/10"
        style={{
          background: 'linear-gradient(180deg, #0b1222, #0b1324)'
        }}
      />

      {/* HUD */}
      <div className="absolute top-8 left-0 right-0 flex justify-center gap-3 pointer-events-none z-[5] flex-wrap">
        <div id="stageBadge" className="glass px-4 py-2 rounded-full font-bold text-sm text-foreground shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
          Stage: 1/4 – About
        </div>
        <div id="timeBadge" className="glass px-4 py-2 rounded-full font-bold text-sm text-foreground shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
          Time: 0:00
        </div>
        <div id="hintBadge" className="glass px-4 py-2 rounded-full font-bold text-sm text-foreground shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
          Arrows: move • Space: jump • E: interact • Esc: pause
        </div>
      </div>

      {/* Menu Overlay */}
      <div id="menu" className="absolute inset-0 grid place-items-center z-10 backdrop-blur-md bg-black/30">
        <div className="card-game w-full max-w-[760px] text-center p-8 mx-4">
          <h1 className="gradient-text text-4xl md:text-5xl font-black mb-4">Interactive Resume Game</h1>
          <p className="opacity-80 mb-6 text-foreground/90 leading-relaxed">
            A fun and challenging way to get to know me - with every level you unlock, you'll discover more about who I am.<br/>
            Use Arrows to move, Space to jump. Press E near the info panels to open it.<br/> 
            4 short stages.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button id="startBtn" className="btn-game px-8 py-3">Start Game</button>
            <button id="howBtn" className="px-8 py-3 rounded-full border border-white/20 bg-secondary/80 hover:bg-secondary text-secondary-foreground font-bold">Controls</button>
          </div>
          <p className="mt-3 opacity-70 text-sm">
            Tip: Press <span className="kbd">E</span> near glowing signs to open info panels.
          </p>
        </div>
      </div>

      {/* Pause Overlay */}
      <div id="pause" className="absolute inset-0 grid place-items-center z-10 backdrop-blur-md bg-black/30" hidden>
        <div className="card-game w-full max-w-[760px] text-center p-8 mx-4">
          <h2 className="text-2xl font-bold mb-4">Paused</h2>
          <p className="mb-4">Quick links</p>
          <div id="quickLinks" className="flex gap-3 justify-center flex-wrap mb-4"></div>
          <div className="flex gap-3 justify-center">
            <button id="resumeBtn" className="px-8 py-3 rounded-full bg-white text-black font-bold">Resume</button>
          </div>
        </div>
      </div>

      {/* Panel Overlay */}
      <div id="panel" className="absolute inset-0 grid place-items-center z-10 backdrop-blur-md bg-black/30" hidden>
        <div id="panelContent" className="card-game w-full max-w-[760px] text-center p-8 mx-4"></div>
      </div>

      {/* Finish Overlay */}
      <div id="finish" className="absolute inset-0 grid place-items-center z-10 backdrop-blur-md bg-black/30" hidden>
        <div className="card-game w-full max-w-[760px] text-center p-8 mx-4">
          <h2 className="text-2xl font-bold mb-4">Thanks for playing!</h2>
          <p id="summary" className="mb-4"></p>
          <div id="finishLinks" className="flex gap-3 justify-center flex-wrap mb-4"></div>
          <div className="flex gap-3 justify-center mb-4">
            <button id="shareBtn" className="px-8 py-3 rounded-full border border-white/20 bg-secondary/80 hover:bg-secondary text-secondary-foreground font-bold">Share summary</button>
            <button id="restartBtn" className="px-8 py-3 rounded-full bg-white text-black font-bold">Restart</button>
          </div>
          <div id="shareFallback" className="mt-4 hidden">
            <p className="opacity-80 mb-2 text-sm">Copy this text manually (Clipboard blocked in some sandboxes):</p>
            <textarea id="shareText" rows={3} className="w-full bg-card border border-white/10 rounded-lg p-3 text-foreground"></textarea>
          </div>
        </div>
      </div>

      {/* Toast */}
      <div id="toast" className="absolute bottom-8 left-1/2 transform -translate-x-1/2 glass px-4 py-3 rounded-lg hidden z-[15] shadow-[0_8px_25px_rgba(0,0,0,0.4)] font-semibold"></div>
      
      {/* Corner */}
      <div className="absolute right-5 bottom-5 opacity-70 text-xs text-foreground/60 font-medium">
        © <span id="year">2024</span> • Built with Gaming Aesthetics
      </div>
    </div>
  );
};

export default Game;