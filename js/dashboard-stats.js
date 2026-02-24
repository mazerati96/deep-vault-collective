// ============================================
// dashboard-stats.js
// ============================================

import { db } from '../auth/firebase-config.js';
import {
    collection,
    getDocs,
    onSnapshot,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// ── DOM targets ───────────────────────────────────────────────────────────────

const elPublished = document.getElementById('stat-published');
const elInProgress = document.getElementById('stat-in-progress');
const elWorlds = document.getElementById('stat-worlds');
const elBreakdown = document.getElementById('breakdown-list');

// ── Boot ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    if (!db) {
        console.warn('[DashboardStats] Firestore not available.');
        setFallback();
        return;
    }
    subscribeToProgress();
});

// ── Live listener (updates instantly when any progress doc changes) ────────────

function subscribeToProgress() {
    const progressCol = collection(db, 'progress');

    onSnapshot(progressCol, (snapshot) => {
        const docs = [];
        snapshot.forEach(d => docs.push({ id: d.id, ...d.data() }));
        renderStats(docs);
        renderBreakdown(docs);
    }, (err) => {
        console.error('[DashboardStats] Snapshot error:', err);
        setFallback();
    });
}

// ── Compute + render stat cards ───────────────────────────────────────────────

function renderStats(docs) {
    const total = docs.length;
    const published = docs.filter(d => d.isComplete).length;
    const inProgress = docs.filter(d => !d.isComplete && (d.percent > 0 || d.stage)).length;

    animateCount(elPublished, published);
    animateCount(elInProgress, inProgress);
    animateCount(elWorlds, total);
}

// ── Build the breakdown table ─────────────────────────────────────────────────

function renderBreakdown(docs) {
    if (!elBreakdown) return;

    // Sort: complete first, then by percent desc, then alphabetically
    const sorted = [...docs].sort((a, b) => {
        if (a.isComplete !== b.isComplete) return a.isComplete ? -1 : 1;
        if ((b.percent ?? 0) !== (a.percent ?? 0)) return (b.percent ?? 0) - (a.percent ?? 0);
        return a.id.localeCompare(b.id);
    });

    elBreakdown.innerHTML = '';

    if (!sorted.length) {
        elBreakdown.innerHTML = '<p class="breakdown-empty">No progress data found.</p>';
        return;
    }

    sorted.forEach(d => {
        const pct = d.isComplete ? 100 : clamp(d.percent ?? 0, 0, 99);
        const stage = d.isComplete
            ? (d.completeLabel ? d.completeLabel.toUpperCase() : 'COMPLETE')
            : (d.stage ? d.stage.toUpperCase() : 'NOT STARTED');

        const row = document.createElement('div');
        row.className = 'breakdown-row' + (d.isComplete ? ' is-complete' : '');

        row.innerHTML = `
            <span class="breakdown-id">${formatId(d.id)}</span>
            <span class="breakdown-stage ${d.isComplete ? 'complete' : ''}">${stage}</span>
            <div class="breakdown-track">
                <div class="breakdown-fill ${d.isComplete ? 'complete' : ''}"
                     style="width: 0%"
                     data-target="${pct}"></div>
            </div>
            <span class="breakdown-pct">${pct}%</span>
        `;

        elBreakdown.appendChild(row);
    });

    // Animate fills after paint
    requestAnimationFrame(() => requestAnimationFrame(() => {
        elBreakdown.querySelectorAll('.breakdown-fill').forEach(el => {
            el.style.width = el.dataset.target + '%';
        });
    }));
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Converts a Firestore doc ID like "deep-vault-prime" into "Deep Vault Prime"
 * for nicer display.
 */
function formatId(id) {
    return id
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Rolls the number up from 0 to target over ~500 ms.
 */
function animateCount(el, target) {
    if (!el) return;
    el.innerHTML = '';           // clear loading spinner
    const duration = 500;
    const start = performance.now();

    function step(now) {
        const progress = Math.min((now - start) / duration, 1);
        el.textContent = Math.round(progress * target);
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = target;
    }

    requestAnimationFrame(step);
}

function setFallback() {
    [elPublished, elInProgress, elWorlds].forEach(el => {
        if (el) el.textContent = '—';
    });
}

function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}