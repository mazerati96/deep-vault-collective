// ============================================
// XENDERON.JS — Hellfire Background
//
// Two systems on one canvas:
//   1. Flame columns — organic bezier flames
//      that flicker and sway, rising from the
//      bottom edge and fading as they climb
//   2. Ember sparks — tiny bright particles
//      that shoot upward from the flame bases
//      and arc off to the sides
//
// All delta-time based for consistent speed
// at any frame rate.
// ============================================

(function () {

    const canvas = document.getElementById('xenderon-canvas');
    const ctx = canvas.getContext('2d');

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    // ============================================
    // FLAME CLASS
    // Each flame is a column that rises from a
    // base point near the bottom of the screen.
    // Shape is generated from randomized bezier
    // control points that sway over time.
    // ============================================

    class Flame {
        constructor() {
            this.reset();
        }

        reset() {
            // Spread flames across the full width
            this.baseX = Math.random() * canvas.width;
            this.baseY = canvas.height + 10;

            // Size — mix of small flickers and large columns
            this.height = 60 + Math.random() * 260;
            this.width = 18 + Math.random() * 55;

            // Opacity — very subtle, purely atmospheric
            this.maxAlpha = 0.04 + Math.random() * 0.09;
            this.alpha = 0;
            this.phase = 'in';

            this.fadeInSpd = 0.00007 + Math.random() * 0.00005;
            this.fadeOutSpd = 0.00004 + Math.random() * 0.00003;
            this.holdMs = 1200 + Math.random() * 3000;
            this.holdTimer = 0;

            // Sway — the flame leans left or right over time
            this.swaySpd = 0.0004 + Math.random() * 0.0005;
            this.swayAmp = 8 + Math.random() * 22;
            this.swayOff = Math.random() * Math.PI * 2;

            // Flicker — rapid small height variation
            this.flickSpd = 0.0015 + Math.random() * 0.002;
            this.flickAmp = 0.08 + Math.random() * 0.14;
            this.flickOff = Math.random() * Math.PI * 2;

            this.elapsed = 0;

            // Color tier — deep red base, orange mid, bright tip
            // Randomly weight toward redder or more orange flames
            this.hot = Math.random() > 0.55; // hotter = more orange
        }

        update(delta) {
            this.elapsed += delta;

            if (this.phase === 'in') {
                this.alpha += this.fadeInSpd * delta;
                if (this.alpha >= this.maxAlpha) {
                    this.alpha = this.maxAlpha;
                    this.phase = 'hold';
                }
            } else if (this.phase === 'hold') {
                this.holdTimer += delta;
                if (this.holdTimer >= this.holdMs) this.phase = 'out';
            } else {
                this.alpha -= this.fadeOutSpd * delta;
                if (this.alpha <= 0) this.reset();
            }
        }

        draw(ctx) {
            if (this.alpha <= 0) return;

            const t = this.elapsed;
            const sway = Math.sin(t * this.swaySpd + this.swayOff) * this.swayAmp;
            const flick = 1 + Math.sin(t * this.flickSpd + this.flickOff) * this.flickAmp;
            const h = this.height * flick;
            const w = this.width;

            // Tip position — apex of the flame
            const tipX = this.baseX + sway;
            const tipY = this.baseY - h;

            // Control points for the bezier sides
            // Left side: base left → lean left mid → tip
            const lbX = this.baseX - w * 0.5;
            const lcX = this.baseX - w * 0.3 + sway * 0.6;
            const lcY = this.baseY - h * 0.55;

            // Right side: base right → lean right mid → tip
            const rbX = this.baseX + w * 0.5;
            const rcX = this.baseX + w * 0.3 + sway * 0.6;
            const rcY = this.baseY - h * 0.55;

            ctx.save();
            ctx.globalAlpha = this.alpha;

            // Build the flame path
            ctx.beginPath();
            ctx.moveTo(lbX, this.baseY);
            ctx.quadraticCurveTo(lcX, lcY, tipX, tipY);
            ctx.quadraticCurveTo(rcX, rcY, rbX, this.baseY);
            ctx.closePath();

            // Gradient: crimson base → orange mid → bright yellow tip
            const grad = ctx.createLinearGradient(this.baseX, this.baseY, tipX, tipY);
            if (this.hot) {
                grad.addColorStop(0, 'rgba(160, 10, 0, 0.9)');
                grad.addColorStop(0.35, 'rgba(220, 50, 10, 0.75)');
                grad.addColorStop(0.65, 'rgba(255, 110, 20, 0.5)');
                grad.addColorStop(1, 'rgba(255, 200, 60, 0.0)');
            } else {
                grad.addColorStop(0, 'rgba(120, 5, 0, 0.9)');
                grad.addColorStop(0.4, 'rgba(190, 20, 0, 0.7)');
                grad.addColorStop(0.75, 'rgba(230, 60, 10, 0.4)');
                grad.addColorStop(1, 'rgba(255, 120, 30, 0.0)');
            }

            ctx.fillStyle = grad;
            ctx.fill();

            // Soft glow at base
            ctx.shadowColor = this.hot ? 'rgba(255, 80, 10, 0.6)' : 'rgba(200, 20, 0, 0.5)';
            ctx.shadowBlur = w * 0.8;
            ctx.beginPath();
            ctx.ellipse(this.baseX, this.baseY, w * 0.4, w * 0.15, 0, 0, Math.PI * 2);
            ctx.fillStyle = this.hot ? 'rgba(255, 100, 20, 0.3)' : 'rgba(200, 30, 0, 0.3)';
            ctx.fill();
            ctx.shadowBlur = 0;

            ctx.restore();
        }
    }

    // ============================================
    // EMBER CLASS
    // Tiny bright sparks that shoot upward from
    // the bottom, arc sideways, and fade out.
    // ============================================

    class Ember {
        constructor(preplace) {
            this.reset(preplace);
        }

        reset(preplace) {
            this.x = Math.random() * canvas.width;
            this.y = preplace
                ? canvas.height * (0.5 + Math.random() * 0.5)
                : canvas.height + 5;

            // Initial velocity — mostly upward with sideways bias
            this.vx = (Math.random() - 0.5) * 0.06;
            this.vy = -(0.04 + Math.random() * 0.1); // px/ms upward

            // Gravity drags upward movement — ember slows and arcs
            this.gravity = 0.00004 + Math.random() * 0.00003;

            this.r = 0.8 + Math.random() * 2;
            this.alpha = 0.5 + Math.random() * 0.5;
            this.decay = 0.0003 + Math.random() * 0.0004; // alpha/ms

            // Hot embers glow orange-white, cooler ones are deep red
            this.hot = Math.random() > 0.4;
            this.elapsed = 0;
        }

        update(delta) {
            this.vy += this.gravity * delta; // slow the rise
            this.x += this.vx * delta;
            this.y += this.vy * delta;
            this.alpha -= this.decay * delta;
            this.elapsed += delta;

            if (this.alpha <= 0 || this.y < -10) this.reset(false);
        }

        draw(ctx) {
            if (this.alpha <= 0) return;
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.shadowColor = this.hot ? 'rgba(255, 180, 60, 0.9)' : 'rgba(220, 50, 0, 0.8)';
            ctx.shadowBlur = this.r * 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.fillStyle = this.hot ? 'rgba(255, 220, 100, 1)' : 'rgba(255, 80, 20, 1)';
            ctx.fill();
            ctx.restore();
        }
    }

    // ============================================
    // POPULATION
    // ============================================

    const FLAME_COUNT = 28;
    const EMBER_COUNT = 35;

    const flames = [];
    const embers = [];

    for (let i = 0; i < FLAME_COUNT; i++) {
        const f = new Flame();
        // Pre-seed some already in hold so screen isn't bare on load
        if (Math.random() > 0.4) {
            f.phase = 'hold';
            f.alpha = f.maxAlpha * (0.3 + Math.random() * 0.7);
            f.holdTimer = Math.random() * f.holdMs;
        }
        flames.push(f);
    }

    for (let i = 0; i < EMBER_COUNT; i++) {
        embers.push(new Ember(true));
    }

    // ============================================
    // RENDER LOOP — delta-time based
    // ============================================

    let lastTime = null;

    function render(timestamp) {
        const delta = lastTime === null ? 16 : Math.min(timestamp - lastTime, 100);
        lastTime = timestamp;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Flames first (larger, behind embers)
        for (const f of flames) { f.update(delta); f.draw(ctx); }

        // Embers on top
        for (const e of embers) { e.update(delta); e.draw(ctx); }

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);

})();