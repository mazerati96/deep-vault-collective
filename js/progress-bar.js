// ============================================
// progress-bar.js — Shared ES Module
// ============================================

// ── Firebase ──────────────────────────────────────────────────────────────────
import { auth, db } from '../auth/firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { doc, getDoc, setDoc }
    from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// ── Default / fallback data ───────────────────────────────────────────────────

const DEFAULT_DATA = {
    stage: 'First Draft',
    percent: 0,
    isComplete: false,
    completeLabel: '',
};

// ── Entry point ───────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('[data-book-id]');
    if (!cards.length) return;

    cards.forEach(card => insertSkeleton(card));

    onAuthStateChanged(auth, (user) => {
        const isAuthor = !!user;
        cards.forEach(card => hydrateCard(card, isAuthor));
    });
});

// ── Skeleton ──────────────────────────────────────────────────────────────────

function insertSkeleton(card) {
    removeSkeleton(card);
    const el = document.createElement('div');
    el.className = 'progress-skeleton';
    card.appendChild(el);
}

function removeSkeleton(card) {
    const el = card.querySelector('.progress-skeleton');
    if (el) el.remove();
}

// ── Hydrate card from Firestore ───────────────────────────────────────────────

async function hydrateCard(card, isAuthor) {
    removeSkeleton(card);

    const prev = card.querySelector('.book-progress');
    if (prev) prev.remove();

    const bookId = card.getAttribute('data-book-id');
    let data = { ...DEFAULT_DATA };

    if (db) {
        try {
            const snap = await getDoc(doc(db, 'progress', bookId));
            if (snap.exists()) data = { ...DEFAULT_DATA, ...snap.data() };
        } catch (err) {
            console.warn(`[ProgressBar] Fetch failed for "${bookId}":`, err);
        }
    }

    updateBadge(card, data);
    renderBar(card, bookId, data, isAuthor);
}

// ── Badge sync ────────────────────────────────────────────────────────────────
// Finds the existing .status-badge in the card header and keeps it
// in sync with whatever is in Firestore.

function updateBadge(card, data) {
    const badge = card.querySelector('.status-badge');
    if (!badge) return;

    const { stage, percent, isComplete, completeLabel } = data;

    // Reset to base class only, then apply the right variant
    badge.className = 'status-badge';

    if (isComplete) {
        badge.classList.add('is-complete');
        badge.textContent = completeLabel
            ? completeLabel.toUpperCase()
            : 'COMPLETE';
    } else if (percent > 0) {
        badge.classList.add('in-progress');
        badge.textContent = `${stage.toUpperCase()} — ${percent}%`;
    } else {
        badge.classList.add('in-progress');
        badge.textContent = stage.toUpperCase();
    }
}

// ── Render ────────────────────────────────────────────────────────────────────

function renderBar(card, bookId, data, isAuthor) {
    const { stage, percent, isComplete, completeLabel } = data;
    const fillPct = isComplete ? 100 : clamp(percent, 0, 99);

    const block = document.createElement('div');
    block.className = 'book-progress';

    // ── Meta row ─────────────────────────────────────────
    const meta = document.createElement('div');
    meta.className = 'progress-meta';

    const stageEl = document.createElement('span');
    stageEl.className = 'progress-stage' + (isComplete ? ' is-complete' : '');
    stageEl.textContent = isComplete
        ? 'COMPLETE' + (completeLabel ? ` — ${completeLabel}` : '')
        : stage.toUpperCase();
    meta.appendChild(stageEl);

    if (isAuthor) {
        const editBtn = document.createElement('button');
        editBtn.className = 'progress-edit-btn';
        editBtn.textContent = 'EDIT';
        editBtn.addEventListener('click', () => {
            const existing = block.querySelector('.progress-edit-panel');
            if (existing) { existing.remove(); return; }
            buildEditPanel(block, card, bookId, data, isAuthor);
        });
        meta.appendChild(editBtn);
    } else if (!isComplete) {
        const pctEl = document.createElement('span');
        pctEl.className = 'progress-percent';
        pctEl.textContent = `${fillPct}%`;
        meta.appendChild(pctEl);
    }

    block.appendChild(meta);

    if (isAuthor && !isComplete) {
        const sub = document.createElement('div');
        sub.className = 'progress-author-sub';
        sub.textContent = `${fillPct}%`;
        block.appendChild(sub);
    }

    // ── Track ─────────────────────────────────────────────
    const track = document.createElement('div');
    track.className = 'progress-track';

    const fill = document.createElement('div');
    fill.className = 'progress-fill' + (isComplete ? ' is-complete' : '');
    fill.style.width = '0%';

    track.appendChild(fill);
    block.appendChild(track);
    card.appendChild(block);

    requestAnimationFrame(() => requestAnimationFrame(() => {
        fill.style.width = `${fillPct}%`;
    }));
}

// ── Edit panel ────────────────────────────────────────────────────────────────

function buildEditPanel(block, card, bookId, data, isAuthor) {
    const { stage, percent, isComplete, completeLabel } = data;

    const panel = document.createElement('div');
    panel.className = 'progress-edit-panel';

    const stageField = makeField(
        `stage-${bookId}`, 'Stage / Version', 'text',
        stage, 'e.g. First Draft, Revision 2, Copy Edits…'
    );
    panel.appendChild(stageField.wrapper);

    const percentField = makeField(
        `percent-${bookId}`, 'Completion % (0 – 99)', 'number',
        percent, ''
    );
    percentField.input.min = 0;
    percentField.input.max = 99;
    percentField.input.style.width = '90px';
    if (isComplete) percentField.wrapper.classList.add('is-dimmed');
    panel.appendChild(percentField.wrapper);

    // ── Complete toggle ──────────────────────
    const completeRow = document.createElement('div');
    completeRow.className = 'progress-complete-row';

    const cbId = `complete-cb-${bookId}`;
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.id = cbId;
    cb.checked = isComplete;

    const cbLabel = document.createElement('label');
    cbLabel.htmlFor = cbId;
    cbLabel.textContent = 'MARK AS COMPLETE';

    completeRow.appendChild(cb);
    completeRow.appendChild(cbLabel);
    panel.appendChild(completeRow);

    const completeLabelField = makeField(
        `completeLabel-${bookId}`, 'Completion Label (shown on badge + bar)',
        'text', completeLabel, 'e.g. Published, Released, Available Now…'
    );
    completeLabelField.wrapper.style.display = isComplete ? 'flex' : 'none';
    panel.appendChild(completeLabelField.wrapper);

    cb.addEventListener('change', () => {
        const checked = cb.checked;
        percentField.wrapper.classList.toggle('is-dimmed', checked);
        completeLabelField.wrapper.style.display = checked ? 'flex' : 'none';
    });

    // ── Actions ──────────────────────────────
    const actions = document.createElement('div');
    actions.className = 'progress-actions';

    const saveBtn = document.createElement('button');
    saveBtn.className = 'progress-save-btn';
    saveBtn.textContent = 'SAVE';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'progress-cancel-btn';
    cancelBtn.textContent = 'CANCEL';

    const savedMsg = document.createElement('span');
    savedMsg.className = 'progress-saved-msg';
    savedMsg.textContent = 'SAVED ✓';

    actions.appendChild(saveBtn);
    actions.appendChild(cancelBtn);
    actions.appendChild(savedMsg);
    panel.appendChild(actions);

    cancelBtn.addEventListener('click', () => panel.remove());

    saveBtn.addEventListener('click', async () => {
        const newData = {
            stage: stageField.input.value.trim() || 'First Draft',
            percent: clamp(parseInt(percentField.input.value, 10) || 0, 0, 99),
            isComplete: cb.checked,
            completeLabel: completeLabelField.input.value.trim(),
        };

        saveBtn.textContent = 'SAVING…';
        saveBtn.disabled = true;

        try {
            await setDoc(doc(db, 'progress', bookId), newData);

            savedMsg.classList.add('visible');
            setTimeout(() => savedMsg.classList.remove('visible'), 2200);

            // Re-render both badge AND bar with the new data
            block.remove();
            updateBadge(card, newData);
            renderBar(card, bookId, newData, isAuthor);
        } catch (err) {
            console.error('[ProgressBar] Save failed:', err);
            saveBtn.textContent = 'SAVE FAILED — RETRY';
            saveBtn.disabled = false;
        }
    });

    block.appendChild(panel);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeField(id, labelText, type, value, placeholder) {
    const wrapper = document.createElement('div');
    wrapper.className = 'progress-field';

    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = labelText;

    const input = document.createElement('input');
    input.type = type;
    input.id = id;
    input.value = value;
    input.placeholder = placeholder;

    wrapper.appendChild(label);
    wrapper.appendChild(input);

    return { wrapper, input };
}

function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}