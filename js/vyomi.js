// ============================================
// VYOMI.JS — Heaven Planet / Aurora Background
//
// A full-spectrum aurora borealis rendered on
// canvas. Three layered systems:
//
//   1. AURORA CURTAINS — vertical shafts of
//      light that hang from a high anchor line
//      and ripple downward. Hue cycles through
//      the full rainbow along the curtain width.
//      Bottom hem flickers. Top fades to dark.
//
//   2. LIGHT BLOOMS — soft radial glows that
//      pulse and drift behind the curtains,
//      adding depth and a divine luminance.
//
//   3. MOTES — tiny bright specks drifting
//      upward through the aurora light.
//
// Uses HSL color cycling for true spectrum
// aurora hues. All delta-time based.
// ============================================

(function () {

    const canvas = document.getElementById('vyomi-canvas');
    if (!canvas) { console.warn('vyomi-canvas not found'); return; }
    const ctx = canvas.getContext('2d');

    let W = 0, H = 0;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        W = canvas.width;
        H = canvas.height;
        buildAurora();
    }
    window.addEventListener('resize', resize);

    function rnd(a, b) { return a + Math.random() * (b - a); }

    // HSL helper — returns a CSS hsl string
    function hsl(h, s, l, a) {
        return `hsla(${h % 360},${s}%,${l}%,${a.toFixed(3)})`;
    }

    // Vyomi pink palette for blooms/motes
    const PINK_PALETTE = [
        { r: 244, g: 167, b: 195 },
        { r: 252, g: 213, b: 229 },
        { r: 192, g: 96, b: 144 },
        { r: 220, g: 130, b: 170 },
        { r: 255, g: 235, b: 245 },
    ];
    function rgba(c, a) { return `rgba(${c.r},${c.g},${c.b},${a.toFixed(3)})`; }

    // ============================================
    // AURORA CURTAIN
    //
    // Each curtain is a vertical band spanning
    // from near the top of the screen down to a
    // flickering lower hem. Internally it is made
    // of COLUMN_COUNT thin vertical columns, each
    // a linear gradient from transparent (top) →
    // colored (mid) → transparent (bottom hem).
    //
    // The hue shifts continuously across columns
    // (full 360° spectrum) and slowly drifts over
    // time, creating rolling color migration.
    //
    // The bottom hem of each column undulates via
    // a per-column sine wave that animates over
    // time — this is the characteristic "fringe"
    // flicker of real aurora.
    // ============================================

    const COLUMN_COUNT = 80;   // columns per curtain
    const CURTAIN_COUNT = 3;   // overlapping curtains

    let curtains = [];

    class AuroraCurtain {
        constructor(index) {
            this.index = index;
            this.init();
        }

        init() {
            // Horizontal span — curtains overlap to cover the full screen
            // Each curtain is wider than the screen; they drift slowly left/right
            this.x = rnd(-W * 0.15, W * 0.05);
            this.width = W * rnd(0.9, 1.4);

            // Vertical anchor — top of curtain sits near the top of screen
            this.topY = H * rnd(-0.05, 0.18);

            // How far the curtain hangs down
            this.hangMin = H * rnd(0.25, 0.45);   // shortest columns
            this.hangMax = H * rnd(0.50, 0.80);   // tallest columns

            // Master opacity
            this.alpha = rnd(0.28, 0.55);

            // Hue base — starting hue for the left edge of this curtain
            // Different for each curtain so they don't all match
            this.hueBase = rnd(0, 360);
            // How many degrees of the spectrum this curtain spans
            this.hueSpan = rnd(180, 360);
            // Hue drift speed — the whole spectrum slowly rolls
            this.hueSpeed = rnd(0.008, 0.022);    // degrees per ms

            // Slow horizontal drift
            this.driftVx = rnd(0.005, 0.015) * (Math.random() > 0.5 ? 1 : -1);

            // Per-column wave parameters for bottom hem flicker
            // Each column gets unique wave so the fringe looks organic
            this.colWaves = [];
            for (let c = 0; c < COLUMN_COUNT; c++) {
                this.colWaves.push({
                    spd1: rnd(0.0008, 0.0020),
                    spd2: rnd(0.0005, 0.0014),
                    amp1: rnd(0.04, 0.12),     // fraction of hangMax
                    amp2: rnd(0.02, 0.08),
                    off1: rnd(0, Math.PI * 2),
                    off2: rnd(0, Math.PI * 2),
                });
            }

            // Brightness wave — vertical luminance pulses that sweep across
            this.brightWaveSpd = rnd(0.0004, 0.0010);
            this.brightWaveOff = rnd(0, Math.PI * 2);

            // Fade in/out lifecycle so curtains breathe over long time
            this.life = rnd(0.3, 1.0);
            this.fadeDir = Math.random() > 0.5 ? 1 : -1;
            this.fadeSpeed = rnd(0.00005, 0.00015);
        }

        update(dt, ts) {
            this.x += this.driftVx * dt;
            this.hueBase = (this.hueBase + this.hueSpeed * dt) % 360;

            // Breathing fade
            this.life += this.fadeDir * this.fadeSpeed * dt;
            if (this.life >= 1.0) { this.life = 1.0; this.fadeDir = -1; }
            if (this.life <= 0.1) { this.life = 0.1; this.fadeDir = 1; }

            // Gentle x bounce so curtains don't wander off screen
            if (this.x > W * 0.2) this.driftVx = -Math.abs(this.driftVx);
            if (this.x < -W * 0.35) this.driftVx = Math.abs(this.driftVx);
        }

        draw(ts) {
            const colW = this.width / COLUMN_COUNT;

            for (let c = 0; c < COLUMN_COUNT; c++) {
                const t = c / (COLUMN_COUNT - 1);   // 0 → 1 across curtain
                const cx = this.x + t * this.width;

                // Skip columns outside viewport (perf)
                if (cx + colW < 0 || cx > W) continue;

                // ── Hue for this column ───────────────────────────
                // t maps 0→1 across the curtain width
                // We offset by hueBase (which drifts over time) so the
                // whole spectrum slowly rolls left or right
                const hue = (this.hueBase + t * this.hueSpan) % 360;

                // Saturation stays high — aurora is vivid
                const sat = 75 + Math.sin(ts * 0.00043 + t * 4) * 15;

                // Lightness — brighter in the middle band of the curtain
                const brightWave = Math.sin(ts * this.brightWaveSpd + t * Math.PI * 3 + this.brightWaveOff) * 0.12;
                const lum = 55 + brightWave * 50;

                // ── Bottom hem position for this column ───────────
                const w = this.colWaves[c];
                const flicker =
                    Math.sin(ts * w.spd1 + w.off1 + c * 0.4) * w.amp1 +
                    Math.sin(ts * w.spd2 + w.off2 + c * 0.7) * w.amp2;
                const hang = this.hangMin + (this.hangMax - this.hangMin) *
                    (0.5 + Math.sin(t * Math.PI * 2.5) * 0.5);   // tallest in middle
                const botY = this.topY + hang * (1 + flicker);

                // ── Alpha ─────────────────────────────────────────
                const a = this.alpha * this.life;

                // ── Gradient: dark top → bright mid → fade out hem ─
                const grad = ctx.createLinearGradient(cx, this.topY, cx, botY);
                grad.addColorStop(0.00, hsl(hue, sat, lum, 0));
                grad.addColorStop(0.08, hsl(hue, sat, lum, a * 0.15));
                grad.addColorStop(0.20, hsl(hue, sat, lum, a * 0.55));
                grad.addColorStop(0.45, hsl(hue, sat, lum, a));
                grad.addColorStop(0.72, hsl(hue, sat, lum, a * 0.65));
                grad.addColorStop(0.88, hsl(hue, sat, lum * 1.3, a * 0.30));
                grad.addColorStop(1.00, hsl(hue, sat, lum * 1.5, 0));

                ctx.fillStyle = grad;
                ctx.fillRect(cx, this.topY, colW + 0.5, botY - this.topY);
            }
        }
    }

    // ============================================
    // BLOOM
    // Soft radial glows — stay tinted pink/rose
    // to keep Vyomi's palette grounding the scene
    // ============================================

    class Bloom {
        constructor(pre) { this.init(pre); }

        init(pre) {
            this.col = PINK_PALETTE[Math.floor(Math.random() * PINK_PALETTE.length)];
            this.x = rnd(0, W);
            this.y = rnd(0, H);
            this.r = rnd(Math.min(W, H) * 0.10, Math.min(W, H) * 0.32);
            this.alpha = rnd(0.018, 0.055);
            this.vx = rnd(-0.004, 0.004);
            this.vy = rnd(-0.003, 0.003);
            this.pulseSpd = rnd(0.0003, 0.0009);
            this.pulseAmp = rnd(0.25, 0.55);
            this.pulseOff = rnd(0, Math.PI * 2);
            this.life = pre ? 1.0 : 0.0;
            this.fadingIn = !pre;
            this.fadingOut = false;
            this.fadeSpd = rnd(0.00006, 0.00015);
            this.holdMs = rnd(8000, 22000);
            this.holdTimer = pre ? rnd(0, this.holdMs) : 0;
        }

        update(dt) {
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            if (this.x < -this.r) this.vx = Math.abs(this.vx);
            if (this.x > W + this.r) this.vx = -Math.abs(this.vx);
            if (this.y < -this.r) this.vy = Math.abs(this.vy);
            if (this.y > H + this.r) this.vy = -Math.abs(this.vy);

            if (this.fadingIn) {
                this.life += this.fadeSpd * dt;
                if (this.life >= 1) { this.life = 1; this.fadingIn = false; }
            } else if (!this.fadingOut) {
                this.holdTimer += dt;
                if (this.holdTimer > this.holdMs) this.fadingOut = true;
            } else {
                this.life -= this.fadeSpd * dt;
                if (this.life <= 0) this.init(false);
            }
        }

        draw(ts) {
            const pulse = 1 + Math.sin(ts * this.pulseSpd + this.pulseOff) * this.pulseAmp * 0.45;
            const a = this.alpha * this.life * pulse;
            if (a < 0.002) return;
            const r = this.r * (0.88 + pulse * 0.12);
            ctx.save();
            const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r);
            g.addColorStop(0, rgba(this.col, a));
            g.addColorStop(0.4, rgba(this.col, a * 0.5));
            g.addColorStop(0.75, rgba(this.col, a * 0.15));
            g.addColorStop(1, rgba(this.col, 0));
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    // ============================================
    // MOTE — tiny drifting specks in the aurora
    // ============================================

    class Mote {
        constructor(pre) { this.init(pre); }
        init(pre) {
            this.x = rnd(0, W);
            this.y = pre ? rnd(0, H) : H + 5;
            this.vy = -rnd(0.008, 0.025);
            this.vx = rnd(-0.007, 0.007);
            this.r = rnd(0.5, 1.8);
            this.a = rnd(0.12, 0.32);
            this.life = 1.0;
            this.dec = rnd(0.00004, 0.00010);
            this.hue = rnd(0, 360);   // motes pick up random aurora hue
            this.pSpd = rnd(0.001, 0.002);
            this.pOff = rnd(0, Math.PI * 2);
        }
        update(dt) {
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            this.life -= this.dec * dt;
            if (this.life <= 0 || this.y < -10) this.init(false);
        }
        draw(ts) {
            const pulse = Math.sin(ts * this.pSpd + this.pOff) * 0.35 + 0.65;
            const a = this.a * this.life * pulse;
            if (a < 0.01) return;
            ctx.save();
            ctx.globalAlpha = a;
            ctx.shadowColor = hsl(this.hue, 90, 75, 0.9);
            ctx.shadowBlur = this.r * 5;
            ctx.fillStyle = hsl(this.hue, 80, 90, 1);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    // ============================================
    // BUILD / POPULATE
    // ============================================

    function buildAurora() {
        curtains.length = 0;
        for (let i = 0; i < CURTAIN_COUNT; i++) {
            curtains.push(new AuroraCurtain(i));
        }
        // Stagger curtains so they aren't all in phase
        curtains[0].hueBase = 0;
        curtains[1].hueBase = 120;
        curtains[2].hueBase = 240;
    }

    const blooms = Array.from({ length: 10 }, () => new Bloom(true));
    const motes = Array.from({ length: 50 }, () => new Mote(true));

    // ============================================
    // RENDER LOOP
    // ============================================

    let lastTime = null;

    function render(ts) {
        const dt = lastTime === null ? 16 : Math.min(ts - lastTime, 80);
        lastTime = ts;

        ctx.clearRect(0, 0, W, H);

        // Blooms behind aurora (depth)
        for (const b of blooms) { b.update(dt); b.draw(ts); }

        // Aurora curtains — drawn with additive-style blending
        // so overlapping curtains brighten each other naturally
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        // Scale down each curtain's contribution so 'lighter' doesn't blow out
        // We do this by drawing into an offscreen and compositing at reduced opacity
        ctx.globalAlpha = 0.55;
        for (const c of curtains) { c.update(dt, ts); c.draw(ts); }
        ctx.restore();

        // Motes on top
        for (const m of motes) { m.update(dt); m.draw(ts); }

        requestAnimationFrame(render);
    }

    resize();
    requestAnimationFrame(render);

})();