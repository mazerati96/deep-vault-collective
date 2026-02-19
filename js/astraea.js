// ============================================
// ASTRAEA.JS — Ink Splatter & Paint Drop Background
// ============================================

(function () {

    const canvas = document.getElementById('ink-canvas');
    const ctx = canvas.getContext('2d');

    // ============================================
    // COLORS — Inkrunners bring color to a
    // monochrome world, so we use the full spectrum
    // kept at low opacity to stay atmospheric
    // ============================================
    const INK_COLORS = [
        '#ff8c2a', // astraea orange
        '#e84545', // inkrunner red
        '#c084fc', // violet
        '#38bdf8', // sky blue
        '#4ade80', // lime green
        '#facc15', // amber
        '#f472b6', // pink
        '#a78bfa', // soft purple
        '#fb923c', // warm orange
        '#34d399', // emerald
    ];

    // ============================================
    // RESIZE HANDLER
    // ============================================
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    window.addEventListener('resize', () => {
        resize();
        // Redraw persistent splatters on resize
        // (we keep them in an array and repaint each frame)
    });

    resize();

    // ============================================
    // DATA STRUCTURES
    // ============================================

    // A splatter: central blob + satellites, fades in and out
    class InkSplatter {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.color = INK_COLORS[Math.floor(Math.random() * INK_COLORS.length)];
            this.radius = 8 + Math.random() * 38;
            this.maxAlpha = 0.04 + Math.random() * 0.07;
            this.alpha = 0;
            this.phase = 'in';
            this.fadeInSpd = 0.0008 + Math.random() * 0.001;
            this.fadeOutSpd = 0.0004 + Math.random() * 0.0006;
            this.holdTimer = 0;
            this.holdMax = 200 + Math.random() * 600;

            // ── Irregular blob shape ──────────────────────────────
            // Pre-compute N points around the center, each at a
            // randomised radius so the outline is jagged and organic.
            // Connected with smooth bezier curves at draw time.
            const numPts = 10 + Math.floor(Math.random() * 7); // 10–16 points
            this.blobPts = [];
            for (let i = 0; i < numPts; i++) {
                const angle = (i / numPts) * Math.PI * 2;
                // Spike variance: 60%–140% of base radius
                const r = this.radius * (0.6 + Math.random() * 0.8);
                this.blobPts.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
            }

            // ── Satellite teardrops ───────────────────────────────
            // Each satellite knows its angle so we draw an elongated
            // teardrop pointing back toward the center (like real splatter).
            this.satellites = [];
            const count = 3 + Math.floor(Math.random() * 7);
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = this.radius * (1.0 + Math.random() * 2.2);
                const bodyLen = 3 + Math.random() * (this.radius * 0.55);
                const bodyW = 1.5 + Math.random() * (this.radius * 0.18);
                this.satellites.push({
                    x: Math.cos(angle) * dist,
                    y: Math.sin(angle) * dist,
                    angle,
                    bodyLen,
                    bodyW,
                });
            }

            // ── Micro-droplets (tiny round specks) ───────────────
            this.micro = [];
            const mCount = 4 + Math.floor(Math.random() * 8);
            for (let i = 0; i < mCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = this.radius * (1.5 + Math.random() * 3.5);
                this.micro.push({
                    x: Math.cos(angle) * dist,
                    y: Math.sin(angle) * dist,
                    r: 0.6 + Math.random() * 2.2,
                });
            }
        }

        update() {
            if (this.phase === 'in') {
                this.alpha += this.fadeInSpd;
                if (this.alpha >= this.maxAlpha) {
                    this.alpha = this.maxAlpha;
                    this.phase = 'hold';
                }
            } else if (this.phase === 'hold') {
                this.holdTimer++;
                if (this.holdTimer >= this.holdMax) {
                    this.phase = 'out';
                }
            } else {
                this.alpha -= this.fadeOutSpd;
                if (this.alpha <= 0) {
                    this.alpha = 0;
                    this.reset(); // recycle instead of removing
                }
            }
        }

        draw(ctx) {
            if (this.alpha <= 0) return;

            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.globalAlpha = this.alpha;
            ctx.fillStyle = this.color;

            // ── Main blob: smooth bezier through jagged points ────
            // Using quadratic bezier curves through midpoints between
            // each pair of vertices — this produces smooth but
            // irregular organic edges that read as real ink.
            ctx.shadowColor = this.color;
            ctx.shadowBlur = this.radius * 0.6;
            ctx.beginPath();
            const pts = this.blobPts;
            const n = pts.length;
            // Start at midpoint between last and first point
            ctx.moveTo(
                (pts[n - 1].x + pts[0].x) / 2,
                (pts[n - 1].y + pts[0].y) / 2
            );
            for (let i = 0; i < n; i++) {
                const curr = pts[i];
                const next = pts[(i + 1) % n];
                // Control point = current vertex (the "spike" or "dent")
                // End point = midpoint to next vertex (smooth join)
                ctx.quadraticCurveTo(
                    curr.x, curr.y,
                    (curr.x + next.x) / 2,
                    (curr.y + next.y) / 2
                );
            }
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;

            // ── Satellite teardrops ───────────────────────────────
            // Each teardrop is drawn as an ellipse rotated so its
            // tail points back toward the center, like ink flung outward.
            for (const s of this.satellites) {
                ctx.save();
                ctx.translate(s.x, s.y);
                // Rotate so the long axis points from splatter center → satellite
                ctx.rotate(s.angle + Math.PI / 2);

                // Teardrop: fat round head, tapering tail toward center
                ctx.beginPath();
                // Head (round end, away from center)
                ctx.arc(0, -s.bodyLen * 0.25, s.bodyW, 0, Math.PI * 2);
                ctx.fill();

                // Tail (tapering toward center using bezier)
                ctx.beginPath();
                ctx.moveTo(-s.bodyW, -s.bodyLen * 0.25);
                ctx.quadraticCurveTo(
                    -s.bodyW * 0.3, s.bodyLen * 0.75,
                    0, s.bodyLen * 0.75
                );
                ctx.quadraticCurveTo(
                    s.bodyW * 0.3, s.bodyLen * 0.75,
                    s.bodyW, -s.bodyLen * 0.25
                );
                ctx.closePath();
                ctx.fill();

                ctx.restore();
            }

            // ── Micro specks at reduced opacity ───────────────────
            ctx.globalAlpha = this.alpha * 0.5;
            for (const m of this.micro) {
                ctx.beginPath();
                ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    }

    // A paint drip: falls downward from a point, tapers at bottom
    class PaintDrip {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * canvas.width;
            this.y = -20;
            this.color = INK_COLORS[Math.floor(Math.random() * INK_COLORS.length)];
            this.width = 1.5 + Math.random() * 4;
            this.speed = 0.18 + Math.random() * 0.45;  // very slow fall
            this.length = 0;
            this.maxLength = 40 + Math.random() * 180;
            this.alpha = 0.04 + Math.random() * 0.09;
            this.done = false;

            // Wobble — a very gentle horizontal sway
            this.wobble = 0;
            this.wobbleSpd = 0.03 + Math.random() * 0.04;
            this.wobbleAmp = 0.4 + Math.random() * 1.2;

            // Bulb at tip — paint accumulates at the bottom
            this.bulbRadius = this.width * (1.2 + Math.random() * 0.8);
        }

        update() {
            if (this.done) { this.reset(); return; }

            this.length += this.speed;
            this.wobble += this.wobbleSpd;

            if (this.length >= this.maxLength) {
                this.done = true;
            }
        }

        draw(ctx) {
            if (this.length <= 0) return;

            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.strokeStyle = this.color;
            ctx.lineWidth = this.width;
            ctx.lineCap = 'round';

            // Draw the drip body as a slightly wobbly line
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);

            // Build segments so the wobble is distributed along the drip
            const segments = Math.ceil(this.length / 5);
            for (let i = 0; i <= segments; i++) {
                const t = i / segments;
                const py = this.y + t * this.length;
                const px = this.x + Math.sin(t * 8 + this.wobble) * this.wobbleAmp;
                ctx.lineTo(px, py);
            }
            ctx.stroke();

            // Bulb at the tip
            ctx.fillStyle = this.color;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = this.bulbRadius * 1.5;
            const tipX = this.x + Math.sin(this.wobble) * this.wobbleAmp;
            const tipY = this.y + this.length;
            ctx.beginPath();
            ctx.arc(tipX, tipY, this.bulbRadius, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }

    // ============================================
    // POPULATION
    // Splatters: always live (they recycle on fade out)
    // Drips: spawn on a timer so they feel organic
    // ============================================

    const SPLATTER_COUNT = 18;
    const splatters = [];

    for (let i = 0; i < SPLATTER_COUNT; i++) {
        const s = new InkSplatter();
        // Stagger — some already mid-hold at load so screen isn't empty
        s.phase = 'hold';
        s.alpha = s.maxAlpha * (Math.random() * 0.8);
        s.holdTimer = Math.floor(Math.random() * s.holdMax);
        splatters.push(s);
    }

    const MAX_DRIPS = 8;
    const drips = [];

    // Spawn a new drip at a random interval
    function spawnDrip() {
        if (drips.filter(d => !d.done).length < MAX_DRIPS) {
            drips.push(new PaintDrip());
        }
        // Next spawn: 1.8–5 seconds
        const nextIn = 1800 + Math.random() * 3200;
        setTimeout(spawnDrip, nextIn);
    }

    // Seed a few drips immediately
    for (let i = 0; i < 3; i++) {
        const d = new PaintDrip();
        d.y = Math.random() * canvas.height * 0.6; // already partway down
        d.length = Math.random() * d.maxLength * 0.5;
        drips.push(d);
    }

    setTimeout(spawnDrip, 2000);

    // ============================================
    // RENDER LOOP
    // We clear with a fully transparent clear each
    // frame — splatters handle their own fade.
    // ============================================
    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Update + draw splatters
        for (const s of splatters) {
            s.update();
            s.draw(ctx);
        }

        // Update + draw drips (remove fully done ones to keep array lean)
        for (const d of drips) {
            d.update();
            d.draw(ctx);
        }

        // Trim drips array — keep only active ones + a buffer
        // (reset handles recycling, so just clean very old done ones)
        if (drips.length > MAX_DRIPS * 3) {
            drips.splice(0, drips.length - MAX_DRIPS);
        }

        requestAnimationFrame(render);
    }

    render();

})();