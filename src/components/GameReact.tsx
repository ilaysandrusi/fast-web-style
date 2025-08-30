import { useEffect, useRef, useState } from 'react';

const GameReact = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<any>({});
  const [gameState, setGameState] = useState({
    showMenu: true,
    showPause: false,
    showPanel: false,
    showFinish: false,
    showShareFallback: false,
    stageBadge: 'Stage: 1/4 – About',
    timeBadge: 'Time: 0:00',
    hintBadge: 'Arrows: move • Space: jump • E: interact • Esc: pause',
    panelContent: '',
    summary: '',
    shareText: ''
  });

  // Game content
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

  const startGame = () => {
    console.log('🎮 Starting game!');
    setGameState(prev => ({ ...prev, showMenu: false }));
    
    // Initialize game logic
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Game constants
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

    // Game state
    const game = {
      player: { x:80, y:H-GROUND_H-40, w:28, h:40, vx:0, vy:0, onGround:false, canInteract:false },
      platforms: [] as any[],
      movers: [] as any[],
      enemies: [] as any[],
      interactors: [] as any[],
      hazards: [] as any[],
      camX: 0,
      checkpointX: 80,
      keys: {} as any,
      tPrev: 0,
      totalTime: 0,
      playing: true,
      isPaused: false,
      finished: false
    };

    gameStateRef.current = game;

    // Build world
    function addGround(x: number, w: number) {
      if(w <= 0) return;
      game.platforms.push({x, y:H-GROUND_H, w, h:GROUND_H, type:'ground'});
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

    // Build world
    const lastStage = stages[stages.length-1];
    const WORLD_LEN = lastStage.start + lastStage.len + 400;

    // Stage 1: flat intro + one simple blocker
    groundWithGaps(stages[0], []);
    game.interactors.push(sign(stages[0].start+300, 'About'));
    game.hazards.push(blocker(stages[0].start+600, H-GROUND_H-22, 30, 22));

    // Stage 2: two gaps + ledge + small blocker
    groundWithGaps(stages[1], [gap(stages[1].start+420, 80), gap(stages[1].start+900, 120)]);
    game.platforms.push({x:stages[1].start+1200, y:H-GROUND_H-60, w:220, h:20, type:'ledge'});
    game.interactors.push(sign(stages[1].start+250, 'Skills'));
    game.hazards.push(blocker(stages[1].start+1050, H-GROUND_H-24, 36, 24));

    // Stage 3: larger pit with moving platform + enemy + blocker
    groundWithGaps(stages[2], [gap(stages[2].start+380, 140)]);
    game.movers.push(movingPlatform(stages[2].start+430, H-GROUND_H-80, 120, 18, 0, 40));
    game.enemies.push(bug(stages[2].start+1100, H-GROUND_H-24, 180));
    game.platforms.push({x:stages[2].start+1350, y:H-GROUND_H-80, w:180, h:20, type:'ledge'});
    game.interactors.push(sign(stages[2].start+260, 'Projects'));
    game.hazards.push(blocker(stages[2].start+1520, H-GROUND_H-28, 44, 28));

    // Stage 4: tighter jumps + finish
    groundWithGaps(stages[3], [gap(stages[3].start+360, 90), gap(stages[3].start+720, 110)]);
    game.interactors.push(sign(stages[3].start+120, 'Links'));
    game.interactors.push(finishGate(WORLD_LEN-160));
    game.hazards.push(blocker(stages[3].start+260, H-GROUND_H-26, 34, 26));
    game.hazards.push(blocker(stages[3].start+540, H-GROUND_H-30, 40, 30));

    // Helper functions
    const rectsOverlap = (a: any, b: any) => (a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y);
    const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
    const fmtTime = (s: number) => {
      const m = Math.floor(s/60);
      const ss = Math.floor(s%60).toString().padStart(2,'0');
      return `${m}:${ss}`;
    };

    function currentStage() {
      for(let i = stages.length-1; i >= 0; i--) {
        if(game.player.x >= stages[i].start) return {index:i, name:stages[i].name};
      }
      return {index:0, name:stages[0].name};
    }

    function respawn(msg?: string) {
      console.log('Respawn:', msg);
      game.totalTime += 1.2;
      game.player.x = game.checkpointX;
      game.player.y = H - GROUND_H - game.player.h;
      game.player.vx = 0;
      game.player.vy = 0;
    }

    // Physics update
    function update(dt: number) {
      const wantLeft = game.keys['ArrowLeft'] || game.keys['KeyA'];
      const wantRight = game.keys['ArrowRight'] || game.keys['KeyD'];
      const wantJump = game.keys['Space'] || game.keys['ArrowUp'];

      if (wantLeft) game.player.vx = -moveSpeed;
      else if (wantRight) game.player.vx = moveSpeed;
      else {
        const sign = Math.sign(game.player.vx);
        const mag = Math.max(0, Math.abs(game.player.vx) - 900*dt);
        game.player.vx = sign*mag;
        if (Math.abs(game.player.vx) < 1) game.player.vx = 0;
      }

      if (wantJump && game.player.onGround) {
        game.player.vy = jumpVy;
        game.player.onGround = false;
      }

      game.player.vy += gravity*dt;
      if (game.player.vy > 1200) game.player.vy = 1200;

      // Move X
      game.player.x += game.player.vx*dt;
      for(const p of game.platforms) {
        const a = {x:game.player.x, y:game.player.y, w:game.player.w, h:game.player.h};
        if (rectsOverlap(a, p)) {
          if (game.player.vx > 0) {
            game.player.x = p.x - game.player.w;
            game.player.vx = 0;
          } else if (game.player.vx < 0) {
            game.player.x = p.x + p.w;
            game.player.vx = 0;
          }
        }
      }

      // Update movers
      for(const m of game.movers) {
        m.t += dt;
        m.y = m.baseY + Math.sin(m.t*1.2)*m.amp;
      }

      // Move Y
      game.player.y += game.player.vy*dt;
      game.player.onGround = false;
      for(const p of [...game.platforms, ...game.movers]) {
        const a = {x:game.player.x, y:game.player.y, w:game.player.w, h:game.player.h};
        if (rectsOverlap(a, p)) {
          if (game.player.vy > 0) {
            game.player.y = p.y - game.player.h;
            game.player.vy = 0;
            game.player.onGround = true;
          } else if (game.player.vy < 0) {
            game.player.y = p.y + p.h;
            game.player.vy = 0;
          }
        }
      }

      // Enemies
      for (let i = game.enemies.length - 1; i >= 0; i--) {
        const b = game.enemies[i];
        b.x += b.dir * 60 * dt;
        if (b.x < b.left || b.x > b.right) b.dir *= -1;

        if (rectsOverlap(game.player, b)) {
          if (game.player.vy > 100 && game.player.y + b.h - 6 <= b.y) {
            game.enemies.splice(i, 1);
            console.log('Bug squashed!');
            game.player.vy = jumpVy * 0.7;
          } else {
            respawn('Hit by enemy!');
          }
        }
      }

      // Hazards
      for(const h of game.hazards) {
        if (rectsOverlap(game.player, h)) {
          respawn('Hit hazard!');
          break;
        }
      }

      // Pits
      if (game.player.y > H) {
        respawn('Fell into pit!');
        return;
      }

      // Finish
      if (game.player.x > WORLD_LEN - 180) {
        setGameState(prev => ({
          ...prev,
          showFinish: true,
          summary: `Completed 4/4 stages in ${fmtTime(game.totalTime)}.`
        }));
        game.finished = true;
        game.playing = false;
      }

      // Camera + UI
      game.camX = clamp(game.player.x - W*0.35, 0, WORLD_LEN - W);
      const near = game.interactors.some(it => 
        it.kind === 'sign' && Math.abs((it.x + it.w/2) - (game.player.x + game.player.w/2)) < 40
      );
      game.player.canInteract = near;

      // Update checkpoint
      const st = currentStage();
      const target = stages[st.index].start + 40;
      if (target > game.checkpointX) game.checkpointX = target;

      // Update UI
      setGameState(prev => ({
        ...prev,
        stageBadge: `Stage: ${st.index+1}/4 – ${st.name}`,
        timeBadge: `Time: ${fmtTime(game.totalTime)}`,
        hintBadge: game.player.canInteract ? 'Press E to open panel' : 'Arrows: move • Space: jump • E: interact • Esc: pause'
      }));
    }

    // Draw function
    function draw() {
      ctx.clearRect(0, 0, W, H);
      
      // Background
      const gradient = ctx.createLinearGradient(0, 0, 0, H);
      gradient.addColorStop(0, '#0f172a');
      gradient.addColorStop(1, '#0b1324');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, W, H);
      
      // Stars
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#22d3ee';
      for(let i = 0; i < 40; i++) {
        const x = ((i*200 - game.camX*0.2) % W + W) % W;
        const y = (i*53) % H;
        ctx.fillRect(x, y, 2, 2);
      }
      ctx.globalAlpha = 1;

      // World
      ctx.save();
      ctx.translate(-game.camX, 0);
      
      // Platforms
      for(const p of game.platforms) {
        ctx.fillStyle = p.type === 'ground' ? '#1f2937' : '#374151';
        ctx.fillRect(p.x, p.y, p.w, p.h);
      }
      
      // Moving platforms
      for(const m of game.movers) {
        ctx.fillStyle = '#6366f1';
        ctx.fillRect(m.x, m.y, m.w, m.h);
      }
      
      // Interactive elements
      for(const s of game.interactors) {
        if (s.kind === 'sign') {
          ctx.fillStyle = '#64748b';
          ctx.fillRect(s.x, s.y, s.w, s.h);
          ctx.fillStyle = '#22d3ee';
          ctx.fillRect(s.x-6, s.y-16, s.w+12, 12);
        }
        if (s.kind === 'finish') {
          ctx.fillStyle = '#7c3aed';
          ctx.fillRect(s.x, s.y, s.w, s.h);
          ctx.fillStyle = '#22d3ee';
          ctx.fillRect(s.x-8, s.y-8, s.w+16, 6);
        }
      }
      
      // Enemies
      for(const b of game.enemies) {
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(b.x, b.y, b.w, b.h);
      }
      
      // Hazards (spikes)
      for(const h of game.hazards) {
        const spikes = Math.max(1, Math.floor(h.w/12));
        ctx.fillStyle = '#dc2626';
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
      }
      
      // Player
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(game.player.x, game.player.y, game.player.w, game.player.h);
      
      ctx.restore();
    }

    // Game loop
    function loop(ts: number) {
      if (!game.tPrev) game.tPrev = ts;
      const dt = Math.min(0.03, (ts-game.tPrev)/1000);
      game.tPrev = ts;
      
      if (game.playing && !game.isPaused && !game.finished) {
        game.totalTime += dt;
        update(dt);
      }
      
      draw();
      if (!game.finished) requestAnimationFrame(loop);
    }

    // Input handling
    const handleKeyDown = (e: KeyboardEvent) => {
      game.keys[e.code] = true;
      if (e.code === 'KeyE' && game.player.canInteract) {
        const nearby = game.interactors.find(it => 
          it.kind === 'sign' && Math.abs((it.x + it.w/2) - (game.player.x + game.player.w/2)) < 40
        );
        if (nearby) {
          openPanelFor(nearby.label);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      game.keys[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Start game loop
    console.log('🔄 Starting game loop');
    requestAnimationFrame(loop);

    // Cleanup function
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  };

  const openPanelFor = (label: string) => {
    let content = '';
    switch(label) {
      case 'About':
        content = `<h2>About – ${CONTENT.candidate.name}</h2><p>${CONTENT.candidate.about}</p>`;
        break;
      case 'Skills':
        content = `<h2>Skills</h2><div class="flex flex-wrap gap-2 justify-center">${CONTENT.skills.map(s => `<span class="px-3 py-1 bg-secondary rounded-full text-sm">${s}</span>`).join('')}</div>`;
        break;
      case 'Projects':
        content = `<h2>Projects</h2>${CONTENT.projects.map(p => `<p><strong>${p.name}</strong> – ${p.note}</p>`).join('')}`;
        break;
      case 'Links':
        content = `<h2>Links</h2><div class="flex gap-2 flex-wrap justify-center">${CONTENT.links.map(l => `<a href="${l.url}" target="_blank" class="btn-game px-4 py-2">${l.label}</a>`).join('')}</div>`;
        break;
    }
    setGameState(prev => ({ ...prev, showPanel: true, panelContent: content }));
  };

  return (
    <div className="fixed inset-0 grid place-items-center bg-gradient-to-b from-sky to-ground">
      <canvas 
        ref={canvasRef}
        width="960" 
        height="540"
        className="w-full max-w-[98vw] h-auto max-h-[90vh] aspect-[16/9] block rounded-[18px] shadow-[0_18px_60px_rgba(0,0,0,0.5),inset_0_0_0_1px_rgba(255,255,255,0.06)] border border-white/10"
        style={{ background: 'linear-gradient(180deg, #0b1222, #0b1324)' }}
      />

      {/* HUD */}
      <div className="absolute top-8 left-0 right-0 flex justify-center gap-3 pointer-events-none z-[5] flex-wrap">
        <div className="glass px-4 py-2 rounded-full font-bold text-sm text-foreground">
          {gameState.stageBadge}
        </div>
        <div className="glass px-4 py-2 rounded-full font-bold text-sm text-foreground">
          {gameState.timeBadge}
        </div>
        <div className="glass px-4 py-2 rounded-full font-bold text-sm text-foreground">
          {gameState.hintBadge}
        </div>
      </div>

      {/* Menu Overlay */}
      {gameState.showMenu && (
        <div className="fixed inset-0 grid place-items-center z-50 backdrop-blur-md bg-black/50">
          <div className="card-game w-full max-w-[760px] text-center p-8 mx-4">
            <h1 className="gradient-text text-4xl md:text-5xl font-black mb-4">Interactive Resume Game</h1>
            <p className="opacity-80 mb-6 text-foreground/90 leading-relaxed">
              A fun and challenging way to get to know me - with every level you unlock, you'll discover more about who I am.<br/>
              Use Arrows to move, Space to jump. Press E near the info panels to open it.<br/> 
              4 short stages.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button onClick={startGame} className="btn-game px-8 py-3">Start Game</button>
              <button 
                onClick={() => alert('Controls:\n• Left/Right: move\n• Space: jump\n• E: interact near glowing signs\n• Esc: pause')}
                className="px-8 py-3 rounded-full border border-white/20 bg-secondary/80 hover:bg-secondary text-secondary-foreground font-bold"
              >
                Controls
              </button>
            </div>
            <p className="mt-3 opacity-70 text-sm">
              Tip: Press <span className="kbd">E</span> near glowing signs to open info panels.
            </p>
          </div>
        </div>
      )}

      {/* Panel Overlay */}
      {gameState.showPanel && (
        <div className="fixed inset-0 grid place-items-center z-50 backdrop-blur-md bg-black/50">
          <div className="card-game w-full max-w-[760px] text-center p-8 mx-4">
            <div dangerouslySetInnerHTML={{ __html: gameState.panelContent }} />
            <button 
              onClick={() => setGameState(prev => ({ ...prev, showPanel: false }))}
              className="mt-4 px-8 py-3 rounded-full bg-white text-black font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Finish Overlay */}
      {gameState.showFinish && (
        <div className="fixed inset-0 grid place-items-center z-50 backdrop-blur-md bg-black/50">
          <div className="card-game w-full max-w-[760px] text-center p-8 mx-4">
            <h2 className="text-2xl font-bold mb-4">Thanks for playing!</h2>
            <p className="mb-4">{gameState.summary}</p>
            <div className="flex gap-3 justify-center flex-wrap">
              {CONTENT.links.map(l => (
                <a key={l.label} href={l.url} target="_blank" rel="noopener" className="btn-game px-4 py-2">
                  {l.label}
                </a>
              ))}
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-8 py-3 rounded-full bg-white text-black font-bold"
            >
              Restart
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameReact;