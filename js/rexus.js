// ============================================
// REXUS.JS — Lotus Flower Background
// ============================================

(function () {

    const canvas = document.getElementById('rexus-canvas');
    const ctx    = canvas.getContext('2d');

    // Bronze/dark gold lotus colors
    const BRONZE_DARK  = 'rgba(120, 80, 8,';    // deep bronze — petal fill
    const BRONZE_MID   = 'rgba(160, 108, 18,';  // mid bronze — petal stroke
    const GOLD_LIGHT   = 'rgba(212, 168, 67,';  // warm gold — center + glow
    const POLLEN       = 'rgba(240, 200, 90,';  // bright gold — pollen specks

    function resize() {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    // ============================================
    // DRAW A SINGLE LOTUS FLOWER
    // ============================================

    function drawLotus(ctx, x, y, size, alpha, rotation) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.globalAlpha = alpha;

        // ── OUTER PETALS (6, wide and flat) ─────────
        const outerCount  = 6;
        const outerLen    = size * 1.0;
        const outerWidth  = size * 0.42;

        for (let i = 0; i < outerCount; i++) {
            const angle = (i / outerCount) * Math.PI * 2;
            ctx.save();
            ctx.rotate(angle);

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(
                -outerWidth, outerLen * 0.3,
                -outerWidth * 0.7, outerLen * 0.85,
                0, outerLen
            );
            ctx.bezierCurveTo(
                outerWidth * 0.7, outerLen * 0.85,
                outerWidth, outerLen * 0.3,
                0, 0
            );
            ctx.closePath();

            // Petal fill — dark bronze with subtle gradient
            const grad = ctx.createLinearGradient(0, 0, 0, outerLen);
            grad.addColorStop(0, `${BRONZE_DARK} 0.7)`);
            grad.addColorStop(0.5, `${BRONZE_MID} 0.5)`);
            grad.addColorStop(1, `${BRONZE_DARK} 0.25)`);
            ctx.fillStyle = grad;
            ctx.fill();

            ctx.strokeStyle = `${BRONZE_MID} 0.35)`;
            ctx.lineWidth   = 0.6;
            ctx.stroke();

            ctx.restore();
        }

        // ── MIDDLE PETALS (6, offset by half step, taller) ──
        const midCount  = 6;
        const midLen    = size * 0.75;
        const midWidth  = size * 0.28;

        for (let i = 0; i < midCount; i++) {
            const angle = ((i + 0.5) / midCount) * Math.PI * 2;
            ctx.save();
            ctx.rotate(angle);

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(
                -midWidth, midLen * 0.25,
                -midWidth * 0.6, midLen * 0.8,
                0, midLen
            );
            ctx.bezierCurveTo(
                midWidth * 0.6, midLen * 0.8,
                midWidth, midLen * 0.25,
                0, 0
            );
            ctx.closePath();

            const grad2 = ctx.createLinearGradient(0, 0, 0, midLen);
            grad2.addColorStop(0, `${BRONZE_MID} 0.75)`);
            grad2.addColorStop(0.6, `${BRONZE_MID} 0.55)`);
            grad2.addColorStop(1, `${GOLD_LIGHT} 0.2)`);
            ctx.fillStyle = grad2;
            ctx.fill();

            ctx.strokeStyle = `${GOLD_LIGHT} 0.25)`;
            ctx.lineWidth   = 0.5;
            ctx.stroke();

            ctx.restore();
        }

        // ── INNER PETALS (5, upright, tight cluster) ──
        const innerCount = 5;
        const innerLen   = size * 0.42;
        const innerWidth = size * 0.14;

        for (let i = 0; i < innerCount; i++) {
            const angle = (i / innerCount) * Math.PI * 2;
            ctx.save();
            ctx.rotate(angle);

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(
                -innerWidth, innerLen * 0.3,
                -innerWidth * 0.5, innerLen * 0.85,
                0, innerLen
            );
            ctx.bezierCurveTo(
                innerWidth * 0.5, innerLen * 0.85,
                innerWidth, innerLen * 0.3,
                0, 0
            );
            ctx.closePath();

            ctx.fillStyle = `${GOLD_LIGHT} 0.45)`;
            ctx.fill();
            ctx.strokeStyle = `${GOLD_LIGHT} 0.3)`;
            ctx.lineWidth   = 0.4;
            ctx.stroke();

            ctx.restore();
        }

        // ── CENTER ───────────────────────────────────
        ctx.shadowColor = `${GOLD_LIGHT} 0.7)`;
        ctx.shadowBlur  = size * 0.4;
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.12, 0, Math.PI * 2);
        ctx.fillStyle = `${GOLD_LIGHT} 0.8)`;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Stamen dots around center
        const stamenCount = 8;
        for (let i = 0; i < stamenCount; i++) {
            const a = (i / stamenCount) * Math.PI * 2;
            const sr = size * 0.2;
            ctx.beginPath();
            ctx.arc(Math.cos(a) * sr, Math.sin(a) * sr, size * 0.025, 0, Math.PI * 2);
            ctx.fillStyle = `${GOLD_LIGHT} 0.6)`;
            ctx.fill();
        }

        ctx.restore();
    }

    // ============================================
    // LOTUS PARTICLE CLASS
    // Each lotus drifts upward slowly, rotating
    // gently, fading in and out.
    // ============================================

    class LotusParticle {
        constructor(preplace) {
            this.reset(preplace);
        }

        reset(preplace) {
            this.x        = Math.random() * canvas.width;
            // Preplace seeds some already on screen so load isn't empty
            this.y        = preplace
                ? Math.random() * canvas.height
                : canvas.height + 80;

            this.size     = 18 + Math.random() * 42; // 18–60px
            this.alpha    = 0;
            this.maxAlpha = 0.06 + Math.random() * 0.1;  // very subtle
            this.phase    = 'in';

            // Rise speed in px/ms — very slow
            this.riseSpd  = 0.008 + Math.random() * 0.012;

            // Gentle horizontal sway
            this.swayAmp  = 15 + Math.random() * 30;
            this.swaySpd  = 0.0003 + Math.random() * 0.0004;
            this.swayOff  = Math.random() * Math.PI * 2;

            // Rotation — slow, peaceful
            this.rotation = Math.random() * Math.PI * 2;
            this.rotSpd   = (Math.random() - 0.5) * 0.0002; // rad/ms

            // Fade timing
            this.fadeInSpd  = 0.00008 + Math.random() * 0.00006;
            this.fadeOutSpd = 0.00004 + Math.random() * 0.00003;
            this.holdMs     = 8000 + Math.random() * 14000;
            this.holdTimer  = preplace ? Math.random() * this.holdMs : 0;
            if (preplace && Math.random() > 0.5) {
                this.phase = 'hold';
                this.alpha = this.maxAlpha * (0.4 + Math.random() * 0.6);
            }

            this.elapsed = 0;
        }

        update(delta) {
            // Rise and sway
            this.y        -= this.riseSpd * delta;
            this.x        += Math.sin(this.elapsed * this.swaySpd + this.swayOff) * 0.03 * delta;
            this.rotation += this.rotSpd * delta;
            this.elapsed  += delta;

            // Fade state machine
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
            }

            // Recycle when fully faded or drifted off top
            if (this.alpha <= 0 || this.y < -100) this.reset(false);
        }

        draw(ctx) {
            if (this.alpha <= 0) return;
            drawLotus(ctx, this.x, this.y, this.size, this.alpha, this.rotation);
        }
    }

    // ============================================
    // POLLEN SPECKS
    // Tiny gold dots — like pollen or dust motes.
    // Very sparse, very faint, just adds texture.
    // ============================================

    class PollenSpeck {
        constructor(preplace) {
            this.reset(preplace);
        }

        reset(preplace) {
            this.x      = Math.random() * canvas.width;
            this.y      = preplace ? Math.random() * canvas.height : canvas.height + 10;
            this.r      = 0.6 + Math.random() * 1.6;
            this.alpha  = 0.04 + Math.random() * 0.12;
            this.riseSpd = 0.012 + Math.random() * 0.02; // px/ms
            this.driftSpd = (Math.random() - 0.5) * 0.008;
            this.twinkleSpd = 0.001 + Math.random() * 0.002;
            this.twinkleOff = Math.random() * Math.PI * 2;
            this.elapsed = 0;
        }

        update(delta) {
            this.y       -= this.riseSpd * delta;
            this.x       += this.driftSpd * delta;
            this.elapsed += delta;
            if (this.y < -10) this.reset(false);
        }

        draw(ctx) {
            const flicker = Math.sin(this.elapsed * this.twinkleSpd + this.twinkleOff) * 0.04;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.fillStyle = `${POLLEN} ${Math.max(0.02, this.alpha + flicker)})`;
            ctx.fill();
        }
    }

    // ============================================
    // POPULATION
    // ============================================

    const LOTUS_COUNT  = 16;
    const POLLEN_COUNT = 55;

    const lotuses = [];
    const pollens = [];

    for (let i = 0; i < LOTUS_COUNT; i++)  lotuses.push(new LotusParticle(true));
    for (let i = 0; i < POLLEN_COUNT; i++) pollens.push(new PollenSpeck(true));

    // ============================================
    // RENDER LOOP — delta-time based
    // ============================================

    let lastTime = null;

    function render(timestamp) {
        const delta = lastTime === null ? 16 : Math.min(timestamp - lastTime, 100);
        lastTime = timestamp;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Pollen behind lotuses
        for (const p of pollens) { p.update(delta); p.draw(ctx); }

        // Lotuses on top
        for (const l of lotuses) { l.update(delta); l.draw(ctx); }

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);

})();