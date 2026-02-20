// ============================================
// LEGATIUS.JS — Mechanical World Background
// ============================================

(function () {

    const canvas = document.getElementById('legatius-canvas');
    const ctx = canvas.getContext('2d');

    const SILVER = 'rgba(184, 201, 212,';
    const ELEC = 'rgba(109, 224, 247,';

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    // ============================================
    // 1. STARS
    // ============================================

    const STAR_COUNT = 160;
    const stars = [];

    for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: 0.4 + Math.random() * 1.4,
            alpha: 0.1 + Math.random() * 0.45,
            twinkleSpd: 0.003 + Math.random() * 0.008,
            twinklePhase: Math.random() * Math.PI * 2,
        });
    }

    // t is elapsed ms — twinkle uses real time so it's also frame-rate independent
    function drawStars(t) {
        for (const s of stars) {
            const flicker = Math.sin(t * 0.001 * s.twinkleSpd * 100 + s.twinklePhase) * 0.15;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fillStyle = `${SILVER} ${Math.max(0.05, s.alpha + flicker)})`;
            ctx.fill();
        }
    }

    // ============================================
    // 2. CIRCUIT TRACES
    // ============================================

    class CircuitTrace {
        constructor() {
            this.build();
        }

        build() {
            const startX = Math.random() * canvas.width;
            const startY = Math.random() * canvas.height;
            this.segments = [];
            let x = startX;
            let y = startY;
            const segCount = 3 + Math.floor(Math.random() * 5);
            let horizontal = Math.random() > 0.5;

            for (let i = 0; i < segCount; i++) {
                const len = 60 + Math.random() * 200;
                const dir = Math.random() > 0.5 ? 1 : -1;
                const nx = horizontal ? x + len * dir : x;
                const ny = horizontal ? y : y + len * dir;
                this.segments.push({ x1: x, y1: y, x2: nx, y2: ny });
                x = nx;
                y = ny;
                horizontal = !horizontal;
            }

            this.totalLen = this.segments.reduce(
                (sum, s) => sum + Math.hypot(s.x2 - s.x1, s.y2 - s.y1), 0
            );

            this.alpha = 0.03 + Math.random() * 0.06;
            this.signalDistPx = Math.random() * this.totalLen;

            // Speed in pixels-per-millisecond
           
            this.signalPxPerMs = 0.012 + Math.random() * 0.01; 

            this.signalSize = 2.5 + Math.random() * 3;
            this.rebuildTimer = 15000 + Math.random() * 20000; // ms, not frames
        }

        update(delta) {
            // Advance by pixels = speed(px/ms) × elapsed(ms)
            this.signalDistPx = (this.signalDistPx + this.signalPxPerMs * delta) % this.totalLen;
            this.rebuildTimer -= delta;
            if (this.rebuildTimer <= 0) {
                const savedSpeed = this.signalPxPerMs;
                this.build();
                this.signalPxPerMs = savedSpeed;
            }
        }

        draw(ctx) {
            ctx.save();
            ctx.strokeStyle = `${SILVER} ${this.alpha})`;
            ctx.lineWidth = 0.8;
            ctx.lineCap = 'square';

            for (const seg of this.segments) {
                ctx.beginPath();
                ctx.moveTo(seg.x1, seg.y1);
                ctx.lineTo(seg.x2, seg.y2);
                ctx.stroke();

                ctx.fillStyle = `${SILVER} ${this.alpha * 1.5})`;
                ctx.beginPath();
                ctx.arc(seg.x1, seg.y1, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }

            const last = this.segments[this.segments.length - 1];
            ctx.fillStyle = `${SILVER} ${this.alpha * 1.5})`;
            ctx.beginPath();
            ctx.arc(last.x2, last.y2, 1.5, 0, Math.PI * 2);
            ctx.fill();

            // Walk segments in pixel space to place signal dot
            let remaining = this.signalDistPx;
            for (const seg of this.segments) {
                const segLen = Math.hypot(seg.x2 - seg.x1, seg.y2 - seg.y1);
                if (remaining <= segLen) {
                    const t = remaining / segLen;
                    const sx = seg.x1 + (seg.x2 - seg.x1) * t;
                    const sy = seg.y1 + (seg.y2 - seg.y1) * t;

                    ctx.shadowColor = `${ELEC} 0.85)`;
                    ctx.shadowBlur = 8;
                    ctx.fillStyle = `${ELEC} 0.85)`;
                    ctx.beginPath();
                    ctx.arc(sx, sy, this.signalSize, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                    break;
                }
                remaining -= segLen;
            }

            ctx.restore();
        }
    }

    const TRACE_COUNT = 14;
    const traces = [];
    for (let i = 0; i < TRACE_COUNT; i++) {
        traces.push(new CircuitTrace());
    }

    // ============================================
    // 3. GEARS
    // ============================================

    class Gear {
        constructor(x, y, outerR, teeth, speedPerMs) {
            this.x = x;
            this.y = y;
            this.outer = outerR;
            this.inner = outerR * 0.72;
            this.hub = outerR * 0.22;
            this.teeth = teeth;
            this.angle = Math.random() * Math.PI * 2;
            this.speed = speedPerMs; // radians per millisecond
            this.alpha = 0.04 + Math.random() * 0.05;
        }

        update(delta) {
            this.angle += this.speed * delta;
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            ctx.strokeStyle = `${SILVER} ${this.alpha})`;
            ctx.lineWidth = 1;

            const step = (Math.PI * 2) / this.teeth;
            const toothW = step * 0.35;

            ctx.beginPath();
            for (let i = 0; i < this.teeth; i++) {
                const base = i * step;
                const riseStart = base + step * 0.15;
                const riseEnd = riseStart + toothW;
                const fallEnd = riseEnd + toothW;

                ctx.arc(0, 0, this.inner, base, riseStart);
                ctx.lineTo(Math.cos(riseStart) * this.outer, Math.sin(riseStart) * this.outer);
                ctx.arc(0, 0, this.outer, riseStart, riseEnd);
                ctx.lineTo(Math.cos(fallEnd) * this.inner, Math.sin(fallEnd) * this.inner);
            }
            ctx.closePath();
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(0, 0, this.hub, 0, Math.PI * 2);
            ctx.stroke();

            const spokeCount = Math.max(3, Math.floor(this.teeth / 4));
            for (let i = 0; i < spokeCount; i++) {
                const a = (i / spokeCount) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(Math.cos(a) * this.hub, Math.sin(a) * this.hub);
                ctx.lineTo(Math.cos(a) * this.inner * 0.85, Math.sin(a) * this.inner * 0.85);
                ctx.stroke();
            }

            ctx.restore();
        }
    }

    // Speeds are now radians/ms.
  
   
    const gears = [
        new Gear(canvas.width * 0.08, canvas.height * 0.18, 130, 18, 0.000042),
        new Gear(canvas.width * 0.92, canvas.height * 0.12, 90, 14, -0.000067),
        new Gear(canvas.width * 0.78, canvas.height * 0.82, 160, 22, 0.000030),
        new Gear(canvas.width * 0.12, canvas.height * 0.78, 100, 16, -0.000050),
        new Gear(canvas.width * 0.5, canvas.height * 0.05, 70, 12, 0.000083),
        new Gear(canvas.width * 0.88, canvas.height * 0.5, 55, 10, -0.000100),
    ];

    // ============================================
    // RENDER LOOP — delta-time based
    // ============================================

    let lastTime = null;

    function render(timestamp) {
        // Cap delta at 100ms so a tab backgrounded then restored
        // doesn't cause a massive single-frame jump
        const delta = lastTime === null ? 16 : Math.min(timestamp - lastTime, 100);
        lastTime = timestamp;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        drawStars(timestamp);

        for (const g of gears) { g.update(delta); g.draw(ctx); }
        for (const tr of traces) { tr.update(delta); tr.draw(ctx); }

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);

})();