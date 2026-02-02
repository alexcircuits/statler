// State
let currentUsername = '';
let currentColor = '58a6ff';
let cardUrl = '';
let colorUpdateTimeout;

// DOM Elements
const usernameInput = document.getElementById('username');
const generateBtn = document.getElementById('generate-btn');
const preview = document.getElementById('preview');
const embedCode = document.getElementById('embed-code');
const embedUrl = document.getElementById('embed-url');
const copyUrlBtn = document.getElementById('copy-url');
const copyMarkdownBtn = document.getElementById('copy-markdown');
const downloadBtn = document.getElementById('download-svg');
const colorBtns = document.querySelectorAll('.color-btn');
const customColorInput = document.getElementById('custom-color');
const toggles = {
    name: document.getElementById('toggle-name'),
    stats: document.getElementById('toggle-stats'),
    languages: document.getElementById('toggle-languages'),
    streak: document.getElementById('toggle-streak'),
    activity: document.getElementById('toggle-activity'),
    private: document.getElementById('toggle-private')
};

// Build card URL
function buildCardUrl() {
    if (!currentUsername) return '';

    const baseUrl = `${window.location.origin}/api/card/${currentUsername}`;
    const params = new URLSearchParams();

    if (!toggles.name.checked) params.set('show_name', 'false');
    if (!toggles.stats.checked) params.set('stats', 'false');
    if (!toggles.languages.checked) params.set('languages', 'false');
    if (!toggles.streak.checked) params.set('streak', 'false');
    if (!toggles.activity.checked) params.set('activity', 'false');
    if (toggles.private.checked) params.set('include_private', 'true');
    if (currentColor !== '58a6ff') params.set('accent', currentColor);

    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

// Update preview
function updatePreview() {
    if (!currentUsername) return;

    cardUrl = buildCardUrl();

    // Add cache buster for preview
    const previewUrl = `${cardUrl}${cardUrl.includes('?') ? '&' : '?'}_t=${Date.now()}`;

    preview.innerHTML = `<img src="${previewUrl}" alt="GitHub Stats Card" />`;
    embedUrl.textContent = cardUrl;
    embedCode.classList.remove('hidden');

    // Enable action buttons
    copyUrlBtn.disabled = false;
    copyMarkdownBtn.disabled = false;
    downloadBtn.disabled = false;
}

// Generate stats
async function generate() {
    const username = usernameInput.value.trim();

    if (!username) {
        showToast('Please enter a username', 'error');
        return;
    }

    if (!/^[a-zA-Z0-9-]+$/.test(username)) {
        showToast('Invalid username format', 'error');
        return;
    }

    currentUsername = username;

    // Show loading
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<span class="loading"></span>';
    preview.innerHTML = '<div class="loading"></div>';

    try {
        // Verify user exists first
        const res = await fetch(`/api/stats/${username}`);

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Failed to fetch stats');
        }

        updatePreview();
        showToast('Card generated!', 'success');
    } catch (err) {
        preview.innerHTML = `<p style="color: var(--error)">${err.message}</p>`;
        embedCode.classList.add('hidden');
        showToast(err.message, 'error');
    } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generate';
    }
}

// Copy to clipboard
async function copyToClipboard(text, message) {
    try {
        await navigator.clipboard.writeText(text);
        showToast(message, 'success');
    } catch {
        showToast('Failed to copy', 'error');
    }
}

// Download SVG
async function downloadSvg() {
    if (!cardUrl) return;

    try {
        const res = await fetch(cardUrl);
        const svg = await res.text();

        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentUsername}-github-stats.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('Downloaded!', 'success');
    } catch {
        showToast('Failed to download', 'error');
    }
}

// Toast notification
function showToast(message, type = '') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

// Event listeners
generateBtn.addEventListener('click', generate);

usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') generate();
});

// Toggle listeners - update preview on change
Object.values(toggles).forEach(toggle => {
    toggle.addEventListener('change', () => {
        if (currentUsername) updatePreview();
    });
});

// Color picker
colorBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        colorBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentColor = btn.dataset.color;
        customColorInput.value = `#${currentColor}`;
        if (currentUsername) updatePreview();
    });
});

customColorInput.addEventListener('input', (e) => {
    currentColor = e.target.value.replace('#', '');
    colorBtns.forEach(b => b.classList.remove('active'));

    // Debounce preview update
    clearTimeout(colorUpdateTimeout);
    colorUpdateTimeout = setTimeout(() => {
        if (currentUsername) updatePreview();
    }, 250);
});

// Action buttons
copyUrlBtn.addEventListener('click', () => {
    copyToClipboard(cardUrl, 'URL copied!');
});

copyMarkdownBtn.addEventListener('click', () => {
    const markdown = `![GitHub Stats](${cardUrl})`;
    copyToClipboard(markdown, 'Markdown copied!');
});

downloadBtn.addEventListener('click', downloadSvg);

// Initial state
copyUrlBtn.disabled = true;
copyMarkdownBtn.disabled = true;
downloadBtn.disabled = true;
