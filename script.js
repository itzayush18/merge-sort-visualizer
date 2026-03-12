/* ═══════════════════════════════════════════════════════════
   Merge Sort — Divide & Conquer Visualizer
   script.js
   ═══════════════════════════════════════════════════════════ */

const $ = id => document.getElementById(id);

// ─── DOM Refs ───────────────────────────────────────────────
const barContainer  = $('bar-container');
const treeContainer = $('tree-container');
const stepLog       = $('step-log');
const stepCounter   = $('step-counter');
const speedSlider   = $('speedSlider');
const speedLabel    = $('speedLabel');
const arrayInput    = $('arrayInput');
const statsText     = $('stats-text');
const progressBar   = $('progress-bar');
const pseudocode    = $('pseudocode');

const btnStart  = $('btnStart');
const btnStep   = $('btnStep');
const btnPause  = $('btnPause');
const btnReset  = $('btnReset');
const btnRandom = $('btnRandom');
const btnTheme  = $('btnTheme');
const btnSound  = $('btnSound');
const btnHelp   = $('btnHelp');
const sizeSlider = $('sizeSlider');
const sizeLabel  = $('sizeLabel');
const modalOverlay = $('modal-overlay');
const modalClose   = $('modal-close');

// ─── Audio Context (lazy init) ──────────────────────────────
let audioCtx = null;
let soundEnabled = true;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playTone(freq, duration, type = 'sine') {
    if (!soundEnabled || !audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + duration);
}

function playDivideSound()  { playTone(440, 0.12); }
function playCompareSound() { playTone(600, 0.08, 'triangle'); }
function playCombineSound() { playTone(880, 0.15); }
function playDoneSound()    { playTone(523, 0.15); setTimeout(() => playTone(659, 0.15), 150); setTimeout(() => playTone(784, 0.25), 300); }

// ─── State ──────────────────────────────────────────────────
let originalArray = [];
let arr = [];
let steps = [];
let stepIdx = 0;
let playing = false;
let paused = false;
let timer = null;
let comparisons = 0;
let mergeOps = 0;
let treeLevels = [];
let treeState = [];

// ─── Pseudocode Lines ───────────────────────────────────────
const pseudocodeLines = [
    { text: '<span class="keyword">function</span> <span class="func">mergeSort</span>(arr, lo, hi):', lineId: 'fn' },
    { text: '    <span class="keyword">if</span> lo &ge; hi: <span class="keyword">return</span> <span class="comment">// base case</span>', lineId: 'base' },
    { text: '    mid &larr; &lfloor;(lo + hi) / 2&rfloor;', lineId: 'mid' },
    { text: '    <span class="func">mergeSort</span>(arr, lo, mid)  <span class="comment">// left half</span>', lineId: 'left' },
    { text: '    <span class="func">mergeSort</span>(arr, mid+1, hi) <span class="comment">// right half</span>', lineId: 'right' },
    { text: '    <span class="func">merge</span>(arr, lo, mid, hi)  <span class="comment">// combine</span>', lineId: 'merge' },
    { text: '', lineId: 'blank' },
    { text: '<span class="keyword">function</span> <span class="func">merge</span>(arr, lo, mid, hi):', lineId: 'mfn' },
    { text: '    L &larr; arr[lo..mid], R &larr; arr[mid+1..hi]', lineId: 'copy' },
    { text: '    <span class="keyword">while</span> L and R not empty:', lineId: 'while' },
    { text: '        <span class="keyword">if</span> L[i] &le; R[j]: pick L[i] <span class="keyword">else</span>: pick R[j]', lineId: 'pick' },
    { text: '    append remaining elements', lineId: 'remain' },
];

function renderPseudocode(activeLine) {
    pseudocode.innerHTML = pseudocodeLines.map(l =>
        `<div class="line${l.lineId === activeLine ? ' active-line' : ''}">${l.text || '&nbsp;'}</div>`
    ).join('');
}

// ─── Helpers ────────────────────────────────────────────────
function getDelay() { return 1100 - speedSlider.value * 100; }

function parseArray() {
    const raw = arrayInput.value.trim();
    const nums = raw.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
    return nums.length ? nums : [38, 27, 43, 3, 9, 82, 10];
}

function randomArray(len) {
    const n = len || (6 + Math.floor(Math.random() * 9));
    return Array.from({ length: n }, () => Math.floor(Math.random() * 99) + 1);
}

// ─── Toast ──────────────────────────────────────────────────
function showToast(msg, duration = 2500) {
    const toast = $('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
}

// ─── Confetti ───────────────────────────────────────────────
function fireConfetti() {
    const canvas = $('confetti-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const particles = [];
    const colors = ['#6c63ff','#ff6b6b','#ffd93d','#6bcb77','#00c9a7','#ff9ff3'];
    for (let i = 0; i < 160; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: -20 - Math.random() * 200,
            w: 4 + Math.random() * 6,
            h: 8 + Math.random() * 8,
            color: colors[Math.floor(Math.random() * colors.length)],
            vy: 2 + Math.random() * 4,
            vx: -2 + Math.random() * 4,
            rot: Math.random() * 360,
            rv: -4 + Math.random() * 8,
            life: 1
        });
    }
    let raf;
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let alive = false;
        particles.forEach(p => {
            if (p.life <= 0) return;
            alive = true;
            p.y += p.vy; p.x += p.vx; p.rot += p.rv; p.life -= 0.005;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot * Math.PI / 180);
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();
        });
        if (alive) raf = requestAnimationFrame(draw);
        else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    draw();
}

// ─── Bar Rendering ──────────────────────────────────────────
function renderBars(array, highlights = {}) {
    const max = Math.max(...array, 1);
    barContainer.innerHTML = '';
    array.forEach((v, i) => {
        const bar = document.createElement('div');
        bar.className = 'bar';
        if (highlights.active  && highlights.active.includes(i))  bar.classList.add('active');
        if (highlights.compare && highlights.compare.includes(i)) bar.classList.add('compare');
        if (highlights.sorted  && highlights.sorted.includes(i))  bar.classList.add('sorted');
        bar.style.height = (v / max) * 230 + 'px';

        // Value label below
        const lbl = document.createElement('span');
        lbl.className = 'bar-label';
        lbl.textContent = v;
        bar.appendChild(lbl);

        // Hover tooltip
        const tip = document.createElement('div');
        tip.className = 'bar-tooltip';
        tip.textContent = `Index: ${i} | Value: ${v}`;
        bar.appendChild(tip);

        barContainer.appendChild(bar);
    });
}

// ─── Tree Rendering ─────────────────────────────────────────
function renderTree() {
    treeContainer.innerHTML = '';
    treeLevels.forEach(level => {
        if (level.phase) {
            const arrow = document.createElement('div');
            arrow.className = 'phase-arrow ' + level.phase;
            arrow.textContent = level.phase === 'divide' ? '↓ DIVIDE ↓' : '↑ COMBINE ↑';
            treeContainer.appendChild(arrow);
        }
        const row = document.createElement('div');
        row.className = 'tree-level';
        level.nodes.forEach(node => {
            const el = document.createElement('div');
            el.className = 'tree-node';
            if (node.highlight) el.classList.add('highlight-' + node.highlight);
            node.values.forEach(v => {
                const sp = document.createElement('span');
                sp.className = 'tree-num';
                sp.textContent = v;
                el.appendChild(sp);
            });
            row.appendChild(el);
        });
        treeContainer.appendChild(row);
    });
}

// ─── Step Log ───────────────────────────────────────────────
function addLog(msg, type) {
    if (stepLog.querySelector('span')) stepLog.innerHTML = '';
    const div = document.createElement('div');
    div.className = 'log-entry ' + type;
    div.textContent = msg;
    stepLog.appendChild(div);
    stepLog.scrollTop = stepLog.scrollHeight;
}

function updateStats() {
    statsText.innerHTML =
        `Array size n = <strong>${originalArray.length}</strong> &nbsp;|&nbsp; ` +
        `Comparisons: <strong>${comparisons}</strong> &nbsp;|&nbsp; ` +
        `Merge operations: <strong>${mergeOps}</strong> &nbsp;|&nbsp; ` +
        `Expected O(n log n) ≈ <strong>${Math.ceil(originalArray.length * Math.log2(originalArray.length))}</strong>`;
}

function updateProgress() {
    const pct = steps.length ? (stepIdx / steps.length) * 100 : 0;
    progressBar.style.width = pct + '%';
}

// ─── Pre-compute Merge Sort Steps ───────────────────────────
function computeSteps(array) {
    steps = []; comparisons = 0; mergeOps = 0;
    treeLevels = [];
    const a = [...array];
    treeLevels.push({ phase: null, nodes: [{ values: [...a], highlight: null }] });

    function mergeSort(arr, lo, hi, depth) {
        if (lo >= hi) return;
        const mid = Math.floor((lo + hi) / 2);
        const subArr = arr.slice(lo, hi + 1);

        steps.push({
            type: 'divide', array: [...arr], lo, hi, mid, pseudoLine: 'mid',
            msg: `Divide [${subArr.join(', ')}] → [${arr.slice(lo, mid + 1).join(', ')}] | [${arr.slice(mid + 1, hi + 1).join(', ')}]`,
            treeAction: { action: 'divide', depth, lo, hi, mid, left: arr.slice(lo, mid + 1), right: arr.slice(mid + 1, hi + 1) }
        });

        mergeSort(arr, lo, mid, depth + 1);
        mergeSort(arr, mid + 1, hi, depth + 1);

        const left = arr.slice(lo, mid + 1);
        const right = arr.slice(mid + 1, hi + 1);
        let i = 0, j = 0, k = lo;
        const ms = [];

        while (i < left.length && j < right.length) {
            comparisons++;
            if (left[i] <= right[j]) {
                ms.push({ picked: left[i], from: 'left', ci: lo + i, cj: mid + 1 + j });
                arr[k++] = left[i++];
            } else {
                ms.push({ picked: right[j], from: 'right', ci: lo + i, cj: mid + 1 + j });
                arr[k++] = right[j++];
            }
        }
        while (i < left.length) arr[k++] = left[i++];
        while (j < right.length) arr[k++] = right[j++];
        mergeOps++;

        const merged = arr.slice(lo, hi + 1);
        ms.forEach(m => {
            steps.push({
                type: 'conquer', array: [...arr], lo, hi, compare: [m.ci, m.cj], pseudoLine: 'pick',
                msg: `Compare: pick ${m.picked} from ${m.from} (${m.from === 'left' ? `left[${m.ci - lo}]` : `right[${m.cj - mid - 1}]`})`,
                treeAction: null
            });
        });

        steps.push({
            type: 'combine', array: [...arr], lo, hi, pseudoLine: 'merge',
            msg: `Merge [${left.join(', ')}] + [${right.join(', ')}] → [${merged.join(', ')}]`,
            treeAction: { action: 'combine', depth, lo, hi, merged }
        });
    }

    mergeSort(a, 0, a.length - 1, 0);
    steps.push({
        type: 'combine', array: [...a], lo: 0, hi: a.length - 1,
        msg: '✅ Array is fully sorted!', treeAction: null, final: true, pseudoLine: null
    });
}

// ─── Tree State ─────────────────────────────────────────────
function resetTreeState() { treeState = []; }

function applyTreeAction(ta) {
    if (!ta) return;
    treeState.push(ta.action === 'divide'
        ? { action: 'divide', depth: ta.depth, left: ta.left, right: ta.right, lo: ta.lo, hi: ta.hi, mid: ta.mid }
        : { action: 'combine', depth: ta.depth, merged: ta.merged, lo: ta.lo, hi: ta.hi });
}

function buildTreeFromState() {
    treeLevels = [];
    const divides  = treeState.filter(s => s.action === 'divide');
    const combines = treeState.filter(s => s.action === 'combine');

    treeLevels.push({ phase: null, nodes: [{ values: [...originalArray], highlight: null }] });

    const divByDepth = {};
    divides.forEach(d => { (divByDepth[d.depth] ||= []).push(d); });
    Object.keys(divByDepth).sort((a, b) => a - b).forEach(dep => {
        const nodes = [];
        divByDepth[dep].sort((a, b) => a.lo - b.lo).forEach(d => {
            nodes.push({ values: d.left, highlight: 'divide' });
            nodes.push({ values: d.right, highlight: 'divide' });
        });
        treeLevels.push({ phase: 'divide', nodes });
    });

    const combByDepth = {};
    combines.forEach(c => { (combByDepth[c.depth] ||= []).push(c); });
    Object.keys(combByDepth).sort((a, b) => b - a).forEach(dep => {
        const nodes = [];
        combByDepth[dep].sort((a, b) => a.lo - b.lo).forEach(c => {
            nodes.push({ values: c.merged, highlight: 'combine' });
        });
        treeLevels.push({ phase: 'combine', nodes });
    });
}

// ─── Execute Step ───────────────────────────────────────────
function executeStep() {
    if (stepIdx >= steps.length) { stop(); return; }
    const s = steps[stepIdx];
    stepIdx++;
    stepCounter.textContent = stepIdx;
    updateProgress();

    // Pseudocode highlight
    renderPseudocode(s.pseudoLine);

    // Sound
    if (s.type === 'divide') playDivideSound();
    else if (s.type === 'conquer') playCompareSound();
    else if (s.type === 'combine') playCombineSound();

    // Bar highlights
    const hl = {};
    if (s.type === 'divide') {
        const indices = []; for (let i = s.lo; i <= s.hi; i++) indices.push(i);
        hl.active = indices;
    } else if (s.type === 'conquer' && s.compare) {
        hl.compare = s.compare;
    } else if (s.type === 'combine') {
        const indices = []; for (let i = s.lo; i <= s.hi; i++) indices.push(i);
        hl.sorted = indices;
    }
    if (s.final) {
        hl.sorted = s.array.map((_, i) => i);
        playDoneSound();
        fireConfetti();
        showToast('🎉 Sorting complete!');
    }

    renderBars(s.array, hl);
    addLog(s.msg, s.type);

    if (s.treeAction) {
        applyTreeAction(s.treeAction);
        buildTreeFromState();
        renderTree();
    }
    updateStats();
    if (stepIdx >= steps.length) stop();
}

// ─── Playback Controls ─────────────────────────────────────
function play() {
    if (stepIdx >= steps.length) return;
    initAudio();
    playing = true; paused = false;
    btnStart.disabled = true; btnStep.disabled = true;
    btnPause.disabled = false; btnPause.textContent = '⏸ Pause';
    tick();
}

function tick() {
    if (!playing || paused) return;
    executeStep();
    if (stepIdx < steps.length && playing) timer = setTimeout(tick, getDelay());
}

function pause() {
    if (paused) {
        paused = false; btnPause.textContent = '⏸ Pause'; tick();
    } else {
        paused = true; btnPause.textContent = '▶ Resume';
        btnStep.disabled = false; clearTimeout(timer);
    }
}

function stop() {
    playing = false; paused = false; clearTimeout(timer);
    btnStart.disabled = (stepIdx >= steps.length);
    btnStep.disabled  = (stepIdx >= steps.length);
    btnPause.disabled = true;
}

function reset() {
    stop();
    stepIdx = 0; comparisons = 0; mergeOps = 0;
    resetTreeState();
    originalArray = parseArray();
    arr = [...originalArray];
    computeSteps(originalArray);
    renderBars(originalArray);
    renderPseudocode(null);
    updateProgress();
    stepLog.innerHTML = '<span style="color:var(--muted)">Press <strong>Start</strong> or <strong>Step</strong> to begin…</span>';
    stepCounter.textContent = '0';
    treeContainer.innerHTML = '<span style="color:var(--muted)">The recursion tree will appear here as the algorithm runs.</span>';
    statsText.innerHTML = `Array size n = <strong>${originalArray.length}</strong> &nbsp;|&nbsp; Expected O(n log n) ≈ <strong>${Math.ceil(originalArray.length * Math.log2(originalArray.length))}</strong>`;
    btnStart.disabled = false; btnStep.disabled = false; btnPause.disabled = true;
}

function stepOnce() {
    initAudio();
    if (steps.length === 0) { originalArray = parseArray(); computeSteps(originalArray); }
    if (stepIdx < steps.length) executeStep();
    if (stepIdx >= steps.length) { btnStep.disabled = true; btnStart.disabled = true; }
}

// ─── Theme Toggle ───────────────────────────────────────────
function toggleTheme() {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', next);
    btnTheme.textContent = next === 'light' ? '🌙' : '☀️';
    showToast(`Switched to ${next} mode`);
}

// ─── Sound Toggle ───────────────────────────────────────────
function toggleSound() {
    soundEnabled = !soundEnabled;
    btnSound.textContent = soundEnabled ? '🔊' : '🔇';
    btnSound.classList.toggle('active', soundEnabled);
    showToast(soundEnabled ? 'Sound ON' : 'Sound OFF');
}

// ─── Collapsible Cards ──────────────────────────────────────
function initCollapsibles() {
    document.querySelectorAll('.card-collapsible .card-header').forEach(header => {
        header.addEventListener('click', () => {
            header.closest('.card-collapsible').classList.toggle('collapsed');
        });
    });
}

// ─── Event Listeners ────────────────────────────────────────
btnStart.addEventListener('click', () => {
    if (stepIdx === 0) { originalArray = parseArray(); computeSteps(originalArray); resetTreeState(); }
    play();
});

btnStep.addEventListener('click', () => {
    if (stepIdx === 0) { originalArray = parseArray(); computeSteps(originalArray); resetTreeState(); }
    stepOnce();
});

btnPause.addEventListener('click', pause);
btnReset.addEventListener('click', reset);

btnRandom.addEventListener('click', () => {
    arrayInput.value = randomArray().join(', ');
    reset();
});

btnTheme.addEventListener('click', toggleTheme);
btnSound.addEventListener('click', toggleSound);

btnHelp.addEventListener('click', () => modalOverlay.classList.add('show'));
modalClose.addEventListener('click', () => modalOverlay.classList.remove('show'));
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) modalOverlay.classList.remove('show'); });

speedSlider.addEventListener('input', () => { speedLabel.textContent = speedSlider.value; });

sizeSlider.addEventListener('input', () => {
    const n = parseInt(sizeSlider.value);
    sizeLabel.textContent = n;
    arrayInput.value = randomArray(n).join(', ');
    reset();
});

// ─── Keyboard Shortcuts ─────────────────────────────────────
document.addEventListener('keydown', e => {
    // Don't trigger when typing in the input field
    if (e.target.tagName === 'INPUT') return;

    switch (e.key.toLowerCase()) {
        case ' ':
        case 'enter':
            e.preventDefault();
            if (playing && !paused) pause();
            else if (paused) pause();
            else { if (stepIdx === 0) { originalArray = parseArray(); computeSteps(originalArray); resetTreeState(); } play(); }
            break;
        case 'arrowright':
        case 'n':
            e.preventDefault();
            if (stepIdx === 0) { originalArray = parseArray(); computeSteps(originalArray); resetTreeState(); }
            stepOnce();
            break;
        case 'r':
            e.preventDefault(); reset(); break;
        case 'g':
            e.preventDefault();
            arrayInput.value = randomArray().join(', '); reset(); break;
        case 't':
            e.preventDefault(); toggleTheme(); break;
        case 's':
            e.preventDefault(); toggleSound(); break;
        case '?':
        case 'h':
            e.preventDefault(); modalOverlay.classList.toggle('show'); break;
        case 'escape':
            modalOverlay.classList.remove('show'); break;
        case '+':
        case '=':
            e.preventDefault();
            speedSlider.value = Math.min(10, parseInt(speedSlider.value) + 1);
            speedLabel.textContent = speedSlider.value;
            break;
        case '-':
            e.preventDefault();
            speedSlider.value = Math.max(1, parseInt(speedSlider.value) - 1);
            speedLabel.textContent = speedSlider.value;
            break;
    }
});

// ─── Init ───────────────────────────────────────────────────
initCollapsibles();
renderPseudocode(null);
reset();
