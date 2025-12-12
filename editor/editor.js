// Default State
const DEFAULT_CONCERT = {
    codename: "nou-concert",
    title: "Nou Concert",
    subtitle: "Lloc - Data",
    begins: undefined,
    ends: undefined,
    hasTimes: false,
    showTitle: true,
    songs: []
};

let concert = JSON.parse(JSON.stringify(DEFAULT_CONCERT));
const collapsedState = new WeakMap();
let isDirty = false;

// Utility Functions
function timestampToInput(ts) {
    if (ts === null || ts === undefined) return "";
    const date = new Date(ts * 1000);
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function inputToTimestamp(val) {
    return Math.floor(new Date(val).getTime() / 1000);
}

function sortNames(names) {
    names.sort((a, b) => {
        const surnameA = a.trim().split(/\s+/).pop().toLowerCase();
        const surnameB = b.trim().split(/\s+/).pop().toLowerCase();
        return surnameA.localeCompare(surnameB);
    });
}

function escapeHtml(text) {
    if (!text) return "";
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Render Functions
function renderSongPreview(song) {
    let html = `<div class="song-preview">`;
    html += `<h3 class="song-title">${escapeHtml(song.title || 'Cançó sense títol')}</h3>`;
    if (song.author) {
        html += `<div class="song-author">${escapeHtml(song.author)}</div>`;
    }
    if (song.performers && song.performers.length > 0) {
        html += `<div class="performers">`;
        song.performers.forEach(performer => {
            if (performer.instrument || (performer.names && performer.names.length > 0)) {
                html += `<div class="performers-item">`;
                if (performer.instrument) {
                    html += `<span class="instrument">${escapeHtml(performer.instrument)}</span>`;
                }
                if (performer.names && performer.names.length > 0) {
                    html += `<span>: ${escapeHtml(performer.names.join(', '))}</span>`;
                }
                html += `</div>`;
            }
        });
        html += `</div>`;
    }
    html += `</div>`;
    return html;
}

function render() {
    renderMetadata();
    renderSongs();
}

function renderMetadata() {
    document.getElementById('codename').value = concert.codename || '';
    document.getElementById('title').value = concert.title || '';
    document.getElementById('subtitle').value = concert.subtitle || '';
    document.getElementById('begins').value = timestampToInput(concert.begins);
    document.getElementById('ends').value = timestampToInput(concert.ends);
}

function renderSongs() {
    const container = document.getElementById('songs-container');
    container.innerHTML = '';

    concert.songs.forEach((song, songIndex) => {
        // Check collapsed state from WeakMap (default to false if not set)
        const isCollapsed = collapsedState.get(song) || false;

        const songEl = document.createElement('div');
        songEl.className = `card song-card ${isCollapsed ? 'collapsed' : ''}`;
        songEl.dataset.index = songIndex;

        let contentHtml = `
            <div class="card-header">
                <div class="card-header-title-row">
                    <span class="drag-handle">☰</span>
                    <h3>${escapeHtml(song.title || 'Cançó sense títol')}</h3>
                </div>
                <div class="song-actions">
                    <button class="btn btn-secondary btn-sm toggle-collapse" onclick="toggleSongCollapse(${songIndex})">
                        ${isCollapsed ? 'Expandir' : 'Col·lapsar'}
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="duplicateSong(${songIndex})">Duplicar</button>
                    <button class="btn btn-danger btn-sm" onclick="removeSong(${songIndex})">Esborrar Cançó</button>
                </div>
            </div>`;
        
        if (isCollapsed) {
            contentHtml += renderSongPreview(song);
        } else {
            contentHtml += `
            <div class="song-details">
                <div class="form-group">
                    <label>Títol</label>
                    <input type="text" value="${escapeHtml(song.title || '')}" oninput="updateSongField(${songIndex}, 'title', this.value)">
                </div>
                <div class="form-group">
                    <label>Autor</label>
                    <input type="text" value="${escapeHtml(song.author || '')}" oninput="updateSongField(${songIndex}, 'author', this.value)">
                </div>
                
                <label>Intèrprets</label>
                <div class="performer-list" id="performers-${songIndex}"></div>
                <button class="btn btn-secondary btn-add-performer" onclick="addPerformer(${songIndex})">+ Afegir Grup d'Intèrprets</button>
            </div>
            `;
        }

        songEl.innerHTML = contentHtml;

        if (!isCollapsed) {
            const performersContainer = songEl.querySelector(`#performers-${songIndex}`);
            
            // Render Performers
            (song.performers || []).forEach((perf, perfIndex) => {
                const perfEl = document.createElement('div');
                perfEl.className = 'card performer-card';
                perfEl.dataset.index = perfIndex;

                perfEl.innerHTML = `
                    <div class="card-header">
                        <div class="performer-header-row">
                            <span class="drag-handle">☰</span>
                            <input type="text" 
                                   class="instrument-input" 
                                   value="${escapeHtml(perf.instrument || '')}" 
                                   oninput="updatePerformerField(${songIndex}, ${perfIndex}, 'instrument', this.value)"
                                   placeholder="Instrument">
                        </div>
                        <button class="btn btn-danger btn-sm" onclick="removePerformer(${songIndex}, ${perfIndex})">×</button>
                    </div>
                    <div class="form-group">
                        <label>Noms (Escriu i prem Retorn o Coma)</label>
                        <div class="chip-container" id="chips-${songIndex}-${perfIndex}">
                            <!-- Chips go here -->
                            <input type="text" class="chip-input" placeholder="Afegir nom..." onkeydown="handleChipInput(event, ${songIndex}, ${perfIndex})">
                        </div>
                    </div>
                `;

                const chipsContainer = perfEl.querySelector(`#chips-${songIndex}-${perfIndex}`);
                const inputEl = perfEl.querySelector('.chip-input');

                // Render Chips
                (perf.names || []).forEach((name, nameIndex) => {
                    const chip = document.createElement('div');
                    chip.className = 'chip';
                    chip.dataset.index = nameIndex;
                    chip.innerHTML = `
                        ${escapeHtml(name)}
                        <span class="remove-chip" onclick="removeName(${songIndex}, ${perfIndex}, ${nameIndex})">&times;</span>
                    `;
                    chipsContainer.insertBefore(chip, inputEl);
                });

                performersContainer.appendChild(perfEl);
            });

            // Initialize Sortable for Performers
            new Sortable(performersContainer, {
                animation: 150,
                handle: '.drag-handle',
                onEnd: function (evt) {
                    const item = concert.songs[songIndex].performers.splice(evt.oldIndex, 1)[0];
                    concert.songs[songIndex].performers.splice(evt.newIndex, 0, item);
                    markDirty();
                    renderSongs(); // Re-render to update indices in callbacks
                }
            });
        }

        container.appendChild(songEl);
    });

    // Initialize Sortable for Songs
    new Sortable(container, {
        animation: 150,
        handle: '.drag-handle',
        onEnd: function (evt) {
            const item = concert.songs.splice(evt.oldIndex, 1)[0];
            concert.songs.splice(evt.newIndex, 0, item);
            markDirty();
            renderSongs(); // Re-render to update indices in callbacks
        }
    });
}

function markDirty() {
    isDirty = true;
}

// Logic Actions
function toggleSongCollapse(songIndex) {
    const song = concert.songs[songIndex];
    const currentState = collapsedState.get(song) || false;
    collapsedState.set(song, !currentState);
    renderSongs();
}

function expandAllSongs() {
    concert.songs.forEach(song => collapsedState.set(song, false));
    renderSongs();
}

function collapseAllSongs() {
    concert.songs.forEach(song => collapsedState.set(song, true));
    renderSongs();
}

function updateMetadata(field, value) {
    if (field === 'begins' || field === 'ends') {
        concert[field] = inputToTimestamp(value);
    } else {
        concert[field] = value;
    }
    markDirty();
}

function updateSongField(index, field, value) {
    concert.songs[index][field] = value;
    // For title, we might want to update the header immediately
    if (field === 'title') {
        const header = document.querySelector(`.song-card[data-index="${index}"] h3`);
        if (header) header.textContent = value || 'Cançó sense títol';
    }
    markDirty();
}

function updatePerformerField(songIndex, perfIndex, field, value) {
    concert.songs[songIndex].performers[perfIndex][field] = value;
    markDirty();
}

function addSong() {
    concert.songs.push({
        title: "",
        author: "",
        performers: [
            {
                instrument: "",
                names: []
            }
        ]
    });
    markDirty();
    renderSongs();
}

function removeSong(index) {
    if (confirm("Estàs segur que vols esborrar aquesta cançó?")) {
        concert.songs.splice(index, 1);
        markDirty();
        renderSongs();
    }
}

function duplicateSong(index) {
    const songToDuplicate = concert.songs[index];
    // Deep copy using JSON parse/stringify
    const newSong = JSON.parse(JSON.stringify(songToDuplicate));
    // Reset any specific properties if needed
    
    // Insert after the current song
    concert.songs.splice(index + 1, 0, newSong);
    markDirty();
    renderSongs();
}

function addPerformer(songIndex) {
    concert.songs[songIndex].performers.push({
        instrument: "",
        names: []
    });
    markDirty();
    renderSongs(); // Re-render to show new performer group
}

function removePerformer(songIndex, perfIndex) {
    concert.songs[songIndex].performers.splice(perfIndex, 1);
    markDirty();
    renderSongs();
}

function handleChipInput(event, songIndex, perfIndex) {
    if (event.key === 'Enter' || event.key === ',') {
        event.preventDefault();
        const val = event.target.value.trim();
        if (val) {
            // Update Model
            const performer = concert.songs[songIndex].performers[perfIndex];
            performer.names.push(val);
            sortNames(performer.names);

            // Granular DOM Update
            const inputEl = event.target;
            const container = inputEl.parentElement;
            
            // Remove existing chips
            const existingChips = container.querySelectorAll('.chip');
            existingChips.forEach(chip => chip.remove());

            // Re-render sorted chips
            performer.names.forEach((name, nameIndex) => {
                const chip = document.createElement('div');
                chip.className = 'chip';
                chip.dataset.index = nameIndex;
                chip.innerHTML = `
                    ${escapeHtml(name)}
                    <span class="remove-chip" onclick="removeName(${songIndex}, ${perfIndex}, ${nameIndex})">&times;</span>
                `;
                container.insertBefore(chip, inputEl);
            });

            inputEl.value = '';
            markDirty();
            // renderSongs() is NOT called, so inputEl remains in DOM and focused
        }
    }
}

function removeName(songIndex, perfIndex, nameIndex) {
    concert.songs[songIndex].performers[perfIndex].names.splice(nameIndex, 1);
    markDirty();
    renderSongs();
}

// Import/Export
function triggerImport() {
    document.getElementById('file-input').click();
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const json = JSON.parse(e.target.result);
            // Validate basic structure?
            concert = { ...DEFAULT_CONCERT, ...json };
            // Ensure hasTimes is false as per req
            concert.hasTimes = false; 

            // Sort all names in imported concert
            if (concert.songs) {
                concert.songs.forEach(song => {
                    if (song.performers) {
                        song.performers.forEach(perf => {
                            if (perf.names) {
                                sortNames(perf.names);
                            }
                        });
                    }
                });
            }

            render();
            isDirty = false;
            alert("Concert carregat correctament!");
        } catch (err) {
            alert("Error analitzant el JSON: " + err.message);
        }
    };
    reader.readAsText(file);
    // Reset input
    event.target.value = '';
}

function exportJSON() {
    if (!concert.begins || !concert.ends) {
        alert("Error: Les dates d'inici i final del concert són obligatòries.");
        return;
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(concert, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", (concert.codename || "concert") + ".json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    isDirty = false;
}

// Init
window.addEventListener('DOMContentLoaded', () => {
    render();
});

window.addEventListener('beforeunload', (e) => {
    if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
    }
});
