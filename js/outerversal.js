// ============================================
// OUTERVERSAL.JS — Realistic Black Hole Background
//
// Inspired by the physics of Gargantua (Interstellar).
// Each black hole renders:
//
//   1. OUTER GLOW — wide soft gravitational
//      light-bending halo around the shadow
//
//   2. ACCRETION DISK — flat ring of plasma.
//      Rendered in two passes (back arc then
//      front arc) so it wraps around the hole.
//      Doppler shift: left side blue-hot,
//      right side red-cool. Temperature color:
//      deep red outer → orange → yellow inner.
//
//   3. PHOTON RING — razor-thin intensely
//      bright ring right at the shadow edge,
//      where light orbits at exactly r=1.5rs
//
//   4. GRAVITATIONAL SHADOW — the black disc,
//      slightly larger than the event horizon
//      due to gravitational lensing of the
//      shadow itself.
//
//   5. INNER GLOW — faint blue-white bloom
//      leaking from just inside the shadow
//      edge (innermost stable circular orbit).
//
//   6. LENSING STARS — star field where stars
//      near a black hole are warped/pulled
//      inward, simulating gravitational lensing.
//
//   7. VOID NEBULAE — deep space backdrop.
//
// All delta-time based.
// ============================================

(function () {

    const canvas = document.getElementById('outerversal-canvas');
    if (!canvas) { console.warn('outerversal-canvas not found'); return; }
    const ctx = canvas.getContext('2d');

    let W = 0, H = 0;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        W = canvas.width;
        H = canvas.height;
        buildScene();
    }
    window.addEventListener('resize', resize);

    function rnd(a, b) { return a + Math.random() * (b - a); }

    // ============================================
    // VOID NEBULA — deep space backdrop
    // ============================================

    class VoidNebula {
        constructor(pre) { this.init(pre); }
        init(pre) {
            this.x = rnd(-W * 0.1, W * 1.1);
            this.y = rnd(-H * 0.1, H * 1.1);
            this.r = rnd(Math.min(W, H) * 0.20, Math.min(W, H) * 0.50);
            this.hue = Math.random() > 0.5 ? rnd(250, 280) : rnd(215, 250);
            this.alpha = rnd(0.020, 0.055);
            this.vx = rnd(-0.002, 0.002);
            this.vy = rnd(-0.002, 0.002);
            this.pSpd = rnd(0.00015, 0.00045);
            this.pOff = rnd(0, Math.PI * 2);
            this.life = pre ? 1.0 : 0.0;
            this.fadingIn = !pre;
            this.fadingOut = false;
            this.fadeSpd = rnd(0.00003, 0.00008);
            this.holdMs = rnd(15000, 35000);
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
            const pulse = 1 + Math.sin(ts * this.pSpd + this.pOff) * 0.22;
            const a = this.alpha * this.life * pulse;
            if (a < 0.002) return;
            ctx.save();
            const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r * pulse);
            g.addColorStop(0, `hsla(${this.hue},65%,22%,${a.toFixed(3)})`);
            g.addColorStop(0.4, `hsla(${this.hue},55%,14%,${(a * 0.6).toFixed(3)})`);
            g.addColorStop(0.75, `hsla(${this.hue},45%, 8%,${(a * 0.2).toFixed(3)})`);
            g.addColorStop(1, `hsla(${this.hue},35%, 4%,0)`);
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r * pulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    // ============================================
    // STAR — twinkles and bends toward black holes
    // ============================================

    class Star {
        constructor() {
            this.reset();
        }
        reset() {
            this.baseX = rnd(0, W);
            this.baseY = rnd(0, H);
            this.r = rnd(0.25, 1.4);
            this.alpha = rnd(0.2, 0.75);
            this.tSpd = rnd(0.0006, 0.0022);
            this.tOff = rnd(0, Math.PI * 2);
            // Slightly blue-white tint for most, occasional warmer star
            this.hue = Math.random() > 0.85 ? rnd(30, 50) : rnd(200, 240);
        }
        draw(ts, blackHoles) {
            // Gravitational lensing displacement
            let dx = 0, dy = 0;
            for (const bh of blackHoles) {
                const ex = this.baseX - bh.x;
                const ey = this.baseY - bh.y;
                const dist = Math.sqrt(ex * ex + ey * ey) + 1;
                const influence = bh.shadowR * 4.5;
                if (dist < influence) {
                    // Pull strength falls off with distance squared
                    const strength = Math.pow(1 - dist / influence, 2) * bh.shadowR * 0.35;
                    dx -= (ex / dist) * strength;
                    dy -= (ey / dist) * strength;
                }
            }

            const tw = Math.sin(ts * this.tSpd + this.tOff);
            const a = this.alpha * (0.65 + tw * 0.35);
            if (a < 0.02) return;

            ctx.save();
            ctx.globalAlpha = a;
            ctx.fillStyle = `hsla(${this.hue},35%,95%,1)`;
            ctx.shadowColor = `hsla(${this.hue},60%,90%,0.6)`;
            ctx.shadowBlur = this.r * 2.5;
            ctx.beginPath();
            ctx.arc(this.baseX + dx, this.baseY + dy, this.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    // ============================================
    // BLACK HOLE — Interstellar / Gargantua style
    // ============================================

    class BlackHole {
        constructor(x, y, r) {
            this.x = x;
            this.y = y;

            // shadowR is what's visually black — slightly larger than
            // event horizon due to photon capture cross-section (~2.6 * rs)
            this.shadowR = r;
            this.diskTilt = rnd(0.12, 0.28);   // perspective tilt of disk plane

            // Disk inner/outer radii
            this.diskInner = r * 1.0;           // disk starts at shadow edge
            this.diskOuter = r * rnd(3.2, 4.8); // outer cool edge

            // Rotation
            this.rot = rnd(0, Math.PI * 2);
            this.rotSpd = rnd(0.00006, 0.00015) * (Math.random() > 0.5 ? 1 : -1);

            // Shimmer — hot plasma turbulence
            this.shimSpd = rnd(0.0006, 0.0014);
            this.shimOff = rnd(0, Math.PI * 2);

            // Doppler: which side is brighter (blueshifted, approaching)
            // In a real black hole the left side of a clockwise-rotating
            // disk is approaching us — we randomise per hole
            this.dopplerSide = Math.random() > 0.5 ? 1 : -1;

            // Fade-in on load
            this.alpha = 0;
            this.targetAlpha = rnd(0.82, 1.0);
            this.fadeSpd = rnd(0.00008, 0.00016);
        }

        update(dt) {
            this.rot += this.rotSpd * dt;
            if (this.alpha < this.targetAlpha) {
                this.alpha = Math.min(this.alpha + this.fadeSpd * dt, this.targetAlpha);
            }
        }

        draw(ts) {
            if (this.alpha < 0.01) return;

            const shimmer = Math.sin(ts * this.shimSpd + this.shimOff);

            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.translate(this.x, this.y);

            // ─────────────────────────────────────────────────────
            // LAYER 1 — Outer gravitational glow
            // Wide, very faint — simulates photons bent from behind
            // ─────────────────────────────────────────────────────
            const glowR = this.diskOuter * 1.55;
            const glow = ctx.createRadialGradient(0, 0, this.shadowR * 0.9, 0, 0, glowR);
            glow.addColorStop(0, 'rgba(0,0,0,0)');
            glow.addColorStop(0.35, `rgba(180,120,60,${(0.04 + shimmer * 0.01).toFixed(3)})`);
            glow.addColorStop(0.65, `rgba(140, 80,40,${0.025.toFixed(3)})`);
            glow.addColorStop(0.85, `rgba( 80, 40,20,${0.012.toFixed(3)})`);
            glow.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(0, 0, glowR, 0, Math.PI * 2);
            ctx.fill();

            // ─────────────────────────────────────────────────────
            // LAYER 2 — Accretion disk, BACK half
            // Drawn first so the event horizon occludes it.
            // The disk is an ellipse (tilted plane viewed in perspective).
            // Back half = top arc of the ellipse.
            // ─────────────────────────────────────────────────────
            this._drawDiskHalf(ts, shimmer, 'back');

            // ─────────────────────────────────────────────────────
            // LAYER 3 — Gravitational shadow (the black disc)
            // ─────────────────────────────────────────────────────

            // Outermost edge fade — blends shadow into the glow
            const edgeFade = ctx.createRadialGradient(0, 0, this.shadowR * 0.75, 0, 0, this.shadowR * 1.05);
            edgeFade.addColorStop(0, 'rgba(0,0,0,1)');
            edgeFade.addColorStop(0.88, 'rgba(0,0,0,1)');
            edgeFade.addColorStop(1, 'rgba(0,0,0,0.0)');
            ctx.fillStyle = edgeFade;
            ctx.beginPath();
            ctx.arc(0, 0, this.shadowR * 1.05, 0, Math.PI * 2);
            ctx.fill();

            // Hard black core
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(0, 0, this.shadowR * 0.96, 0, Math.PI * 2);
            ctx.fill();

            // ─────────────────────────────────────────────────────
            // LAYER 4 — Photon ring
            // An intensely bright, razor-thin ring at r ≈ 1.5 rs
            // In reality it's logarithmically narrow — we fake it
            // with a tight glow + stroke.
            // ─────────────────────────────────────────────────────
            const pRingR = this.shadowR * 1.0;
            const pBright = 0.55 + shimmer * 0.12;

            // Soft bloom behind the ring
            const pGlow = ctx.createRadialGradient(0, 0, pRingR * 0.82, 0, 0, pRingR * 1.22);
            pGlow.addColorStop(0, `rgba(255,220,140,0)`);
            pGlow.addColorStop(0.38, `rgba(255,220,140,${(pBright * 0.38).toFixed(3)})`);
            pGlow.addColorStop(0.62, `rgba(255,200,100,${(pBright * 0.55).toFixed(3)})`);
            pGlow.addColorStop(0.82, `rgba(255,180, 80,${(pBright * 0.22).toFixed(3)})`);
            pGlow.addColorStop(1, 'rgba(255,160,60,0)');
            ctx.fillStyle = pGlow;
            ctx.beginPath();
            ctx.arc(0, 0, pRingR * 1.22, 0, Math.PI * 2);
            ctx.fill();

            // The actual thin ring stroke
            ctx.strokeStyle = `rgba(255,235,175,${(pBright * 0.70).toFixed(3)})`;
            ctx.lineWidth = this.shadowR * 0.040;
            ctx.shadowColor = 'rgba(255,220,140,0.9)';
            ctx.shadowBlur = this.shadowR * 0.18;
            ctx.beginPath();
            ctx.arc(0, 0, pRingR, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;

            // ─────────────────────────────────────────────────────
            // LAYER 5 — Accretion disk, FRONT half
            // Drawn on top of the shadow so it visually wraps around
            // the front of the black hole.
            // ─────────────────────────────────────────────────────
            this._drawDiskHalf(ts, shimmer, 'front');

            ctx.restore();
        }

        // ── Disk half drawing helper ──────────────────────────
        // pass: 'back' (upper/behind) | 'front' (lower/in-front)
        _drawDiskHalf(ts, shimmer, pass) {

            ctx.save();
            ctx.rotate(this.rot);

            // Clip to the correct semicircle
            // 'back'  = angles π → 2π  (top of ellipse, behind hole)
            // 'front' = angles 0 → π   (bottom of ellipse, in front)
            const clipStart = pass === 'back' ? Math.PI : 0;
            const clipEnd = pass === 'back' ? Math.PI * 2 : Math.PI;

            // We need to clip to an ellipse (disk tilt) not a circle.
            // Scale y by diskTilt to get the ellipse, clip, then draw.
            ctx.save();
            ctx.scale(1, this.diskTilt);

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, this.diskOuter * 1.6, clipStart, clipEnd);
            ctx.closePath();
            ctx.clip();

            // ── Radial gradient: inner hot (white-yellow) → outer cool (deep red) ──
            // Also add Doppler asymmetry: multiply left/right brightness
            // We approximate Doppler by using two overlapping gradients —
            // one for temperature (radial) and one for Doppler (angular, faked
            // by shifting the gradient centre slightly off-axis).

            const dopplerOff = this.diskOuter * 0.22 * this.dopplerSide;

            // Temperature gradient (radial from centre)
            const tempGrad = ctx.createRadialGradient(
                dopplerOff, 0, this.diskInner * 0.9,
                0, 0, this.diskOuter
            );

            // Innermost: blue-white (hottest — ~20,000K plasma)
            tempGrad.addColorStop(0.00, `rgba(200,220,255,${(0.85 + shimmer * 0.08).toFixed(3)})`);
            // Near inner: bright yellow-white
            tempGrad.addColorStop(0.08, `rgba(255,245,200,${(0.80).toFixed(3)})`);
            // Inner-mid: bright yellow-orange
            tempGrad.addColorStop(0.20, `rgba(255,210,100,${(0.72).toFixed(3)})`);
            // Mid: orange
            tempGrad.addColorStop(0.38, `rgba(255,150, 50,${(0.60).toFixed(3)})`);
            // Outer-mid: deep orange-red
            tempGrad.addColorStop(0.58, `rgba(220, 80, 20,${(0.42).toFixed(3)})`);
            // Outer: dark red, fading
            tempGrad.addColorStop(0.78, `rgba(140, 30,  8,${(0.22).toFixed(3)})`);
            // Edge: transparent
            tempGrad.addColorStop(1.00, 'rgba(60,10,4,0)');

            ctx.fillStyle = tempGrad;
            ctx.beginPath();
            ctx.arc(0, 0, this.diskOuter, 0, Math.PI * 2);
            ctx.fill();

            // ── Doppler brightening overlay ───────────────────────
            // Approaching side (dopplerSide) gets a hot blue-white wash
            // Receding side gets a subtle red-orange dimming
            // We fake this with a horizontal linear gradient
            const dopplerGrad = ctx.createLinearGradient(
                -this.diskOuter, 0, this.diskOuter, 0
            );
            if (this.dopplerSide > 0) {
                // Left side approaching (blueshifted)
                dopplerGrad.addColorStop(0, 'rgba(180,210,255,0.28)');
                dopplerGrad.addColorStop(0.38, 'rgba(180,210,255,0.08)');
                dopplerGrad.addColorStop(0.62, 'rgba(255,100, 30,0.06)');
                dopplerGrad.addColorStop(1, 'rgba(200, 60, 10,0.20)');
            } else {
                // Right side approaching
                dopplerGrad.addColorStop(0, 'rgba(200, 60, 10,0.20)');
                dopplerGrad.addColorStop(0.38, 'rgba(255,100, 30,0.06)');
                dopplerGrad.addColorStop(0.62, 'rgba(180,210,255,0.08)');
                dopplerGrad.addColorStop(1, 'rgba(180,210,255,0.28)');
            }
            ctx.fillStyle = dopplerGrad;
            ctx.beginPath();
            ctx.arc(0, 0, this.diskOuter, 0, Math.PI * 2);
            ctx.fill();

            // ── Hole cutout — remove disk where the shadow would occlude ──
            // (Only needed for the back half — front half naturally overlaps the shadow)
            if (pass === 'back') {
                ctx.globalCompositeOperation = 'destination-out';
                ctx.fillStyle = 'rgba(0,0,0,1)';
                ctx.beginPath();
                ctx.arc(0, 0, this.diskInner * 0.95, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalCompositeOperation = 'source-over';
            }

            ctx.restore(); // restore scale
            ctx.restore(); // restore rotate
        }
    }

    // ============================================
    // SCENE BUILDER
    // ============================================

    let nebulae = [];
    let stars = [];
    let blackHoles = [];

    function buildScene() {
        nebulae = Array.from({ length: 7 }, () => new VoidNebula(true));
        stars = Array.from({ length: 220 }, () => new Star());

        blackHoles = [];
        const count = W > 900 ? 3 : 2;

        // Distribute positions to avoid overlap and spread across viewport
        const positions = [
            { x: W * rnd(0.08, 0.24), y: H * rnd(0.10, 0.38) },
            { x: W * rnd(0.64, 0.88), y: H * rnd(0.50, 0.82) },
            { x: W * rnd(0.40, 0.62), y: H * rnd(0.12, 0.32) },
        ];

        // Sizes: first is largest, others progressively smaller
        const baseSize = Math.min(W, H) * 0.075;
        const sizes = [baseSize, baseSize * rnd(0.55, 0.72), baseSize * rnd(0.32, 0.50)];

        for (let i = 0; i < count; i++) {
            blackHoles.push(new BlackHole(positions[i].x, positions[i].y, sizes[i]));
        }
    }

    // ============================================
    // RENDER LOOP
    // ============================================

    let lastTime = null;

    function render(ts) {
        const dt = lastTime === null ? 16 : Math.min(ts - lastTime, 80);
        lastTime = ts;

        ctx.clearRect(0, 0, W, H);

        // Nebulae — furthest back
        for (const n of nebulae) { n.update(dt); n.draw(ts); }

        // Stars with lensing
        for (const s of stars) { s.draw(ts, blackHoles); }

        // Black holes
        for (const bh of blackHoles) { bh.update(dt); bh.draw(ts); }

        requestAnimationFrame(render);
    }

    resize();
    requestAnimationFrame(render);

})();