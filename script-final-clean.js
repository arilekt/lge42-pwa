const userData = {}; // หรือ preload จาก localStorage ถ้ามี
localStorage.setItem("purchaseHistory", JSON.stringify(userData));

// script-final-clean.js
// Global API URL
const API = {
    generateNumber: './data/generateNumber.json',
    heatmap: './data/heatmap.json',
    pastResults: './data/pastResults.json',
    purchaseHistory: './data/purchaseHistory.json',
    purchaseHistorySave: './data/purchaseHistory.json',
    rawHistoryList: './data/rawHistoryList.json',
    getHistoryPattern: './data/getHistoryPattern.json'
};



window.currentHeatmap = {}; // Global heatmap data

const LIMIT_DISPLAY = 2;
const POSITION_KEYS = ['pos1', 'pos2', 'pos3', 'pos4', 'pos5', 'pos6']; // หน่วย -> แสน

window.addEventListener("load", function () {
    initializeDashboard();
    initializeMenu();
});

// Purchase history modal event listeners
document.getElementById('menu-purchase-history-update')?.addEventListener('click', () => {
    const modal = document.getElementById('purchase-history-modal');
    modal.style.display = 'flex';
    initPurchaseHistoryEditor();
});

document.getElementById('close-modal-btn')?.addEventListener('click', () => {
    const modal = document.getElementById('purchase-history-modal');
    modal.style.display = 'none';
});

// Initialize dashboard data
async function initializeDashboard() {
    try {
        const [heatmapRes, pastRes, historyRes] = await Promise.all([
            fetch(API.heatmap),
            fetch(API.pastResults),
            fetch(API.purchaseHistory)
        ]);

        // ✅ วางโค้ด update h2 ตรงนี้เลย
        const pastResultsHeader = document.querySelector('#past-results h2');
        if (pastResultsHeader && pastRes && pastRes.drawDate) {
            pastResultsHeader.textContent = `Past Results รางวัลที่ 1: ${pastRes.drawDate}`;
        }

        
        const heatmap = await heatmapRes.json();
        const pastResults = await pastRes.json();
        const purchaseHistoryRaw = await historyRes.json();

        window.currentHeatmap = heatmap;

        renderHeatmap(heatmap);
        renderPastResults(pastResults, heatmap);
        renderPurchaseHistory(purchaseHistoryRaw, pastResults, heatmap);
        loadSuggestions();
        loadPatternChart();

        // Connect Generate Number button
        document.getElementById("generate-button").addEventListener("click", () => {
            loadSuggestions();
        });
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Initialize menu functionality
function initializeMenu() {
    const menuButton = document.getElementById('menu-button');
    const sideMenu = document.getElementById('side-menu');
    const menuOverlay = document.getElementById('menu-overlay');
    const closeMenu = document.getElementById('close-menu');

    menuButton?.addEventListener('click', () => {
        sideMenu?.classList.toggle('show');
        menuOverlay?.classList.toggle('active');
    });

    closeMenu?.addEventListener('click', () => {
        sideMenu?.classList.remove('show');
        menuOverlay?.classList.remove('active');
    });

    menuOverlay?.addEventListener('click', () => {
        sideMenu?.classList.remove('show');
        menuOverlay?.classList.remove('active');
    });
}

// Load and render suggestion numbers
async function loadSuggestions() {
    const response = await fetch(API.generateNumber);
    const data = await response.json();

    const container = document.getElementById("suggestions-section");
    container.innerHTML = "";

    for (const [mode, suggestions] of Object.entries(data)) {
        const block = document.createElement("div");
        block.className = "p-4 border rounded bg-white";

        const title = document.createElement("h4");
        title.className = "font-bold mb-2 text-blue-700";
        title.innerText = mode.replace(/-/g, " ").toUpperCase();
        block.appendChild(title);

        suggestions.forEach(sugg => {
            const item = document.createElement("div");
            item.className = "history-item flex items-center justify-start gap-2";

            const numberDisplay = document.createElement("div");
            numberDisplay.className = "number-display flex gap-1";

            const digits = sugg.number.split('').reverse();
            digits.forEach((digit, index) => {
                const pos = POSITION_KEYS[index] || 'pos1';
                const heatValue = window.currentHeatmap[pos]?.[digit] ?? 0;

                const box = document.createElement('div');
                box.className = `number-box heatmap-${Math.min(9, Math.max(0, heatValue))}`;
                box.textContent = digit;
                box.title = `Heat: ${heatValue}`;
                numberDisplay.prepend(box);
            });

            // Confidence and description
            const desc = document.createElement("div");
            desc.className = "match-info";
            desc.innerHTML = `🔥 ${Math.round(sugg.confidence * 100)}% - ${sugg.description}`;

            item.appendChild(numberDisplay);
            item.appendChild(desc);
            block.appendChild(item);
        });

        container.appendChild(block);
    }
}

// Render heatmap grid
function renderHeatmap(heatmap) {
    const container = document.querySelector('.heatmap-grid');
    if (!container) return;
    container.innerHTML = '';

    if (typeof heatmap !== 'object') return;

    const positionNames = Object.keys(heatmap);
    positionNames.forEach(positionName => {
        const row = document.createElement('div');
        row.className = 'heatmap-row';

        const header = document.createElement('div');
        header.className = 'row-header';
        header.textContent = positionName;
        row.appendChild(header);

        for (let d = 0; d <= 9; d++) {
            const digitBox = document.createElement('div');
            const heatValue = heatmap[positionName]?.[d] ?? 0;
            digitBox.className = `digit-box heatmap-${Math.min(9, Math.max(0, heatValue))}`;
            digitBox.textContent = d;
            digitBox.title = `Heat: ${heatValue}`;
            row.appendChild(digitBox);
        }

        container.appendChild(row);
    });
}

// Load pattern chart data
async function loadPatternChart() {
    const response = await fetch(API.getHistoryPattern);
    const data = await response.json();

    const topPatterns = data.main.slice(0, 20);

    const ctx = document.getElementById("patternChartMain").getContext("2d");
    new Chart(ctx, {
        type: "bar",
        data: {
            labels: topPatterns.map(p => p.pattern),
            datasets: [{
                label: "จำนวนครั้ง",
                data: topPatterns.map(p => p.count),
                backgroundColor: "rgba(75, 192, 192, 0.7)"
            }]
        },
        options: {
            indexAxis: "y",
            responsive: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const idx = context.dataIndex;
                            const pattern = topPatterns[idx];
                            return ` ${pattern.pattern} - ${pattern.count} ครั้ง (${pattern.percent}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Update the h2 of the past-results section to include the draw date



// Render past lottery results
function renderPastResults(pastResults, heatmap) {
    const containerTop = document.getElementById('prize-top');
    const containerLower = document.getElementById('prize-lower');
    const container35 = document.getElementById('prize-3-5-container');
    if (!containerTop || !containerLower || !container35) return;

    containerTop.innerHTML = '';
    containerLower.innerHTML = '';
    container35.innerHTML = '';

    const POSITION_KEYS = ['pos6', 'pos5', 'pos4', 'pos3', 'pos2', 'pos1']; // ซ้ายไปขวา

    // Update section headers to include draw date
    const pastResultsHeader = document.querySelector('#past-results h2');
    if (pastResultsHeader && pastResults.drawDate) {
        pastResultsHeader.textContent = `Past Results รางวัลที่ 1: ${pastResults.drawDate}`;
    }

    const pastResults35Header = document.querySelector('#past-results-3-5 h2');
    if (pastResults35Header && pastResults.drawDate) {
        pastResults35Header.textContent = `Past Results รางวัลที่ 3-5: ${pastResults.drawDate}`;
    }

    function renderNumberWithHeat(number, container) {
        const digits = (number || '').split('');
        digits.forEach((digit, index) => {
            const pos = POSITION_KEYS[index] || 'pos1';
            const heatValue = heatmap[pos]?.[digit] ?? 0;
            const box = document.createElement('span');
            box.className = `number-box heatmap-${Math.min(9, Math.max(0, heatValue))}`;
            box.textContent = digit;
            box.title = `Heat: ${heatValue}`;
            container.appendChild(box);
        });
    }

    // รางวัลที่ 1
    if (pastResults.winningNumber) {
        const div = document.createElement('div');
        div.className = 'past-result';

        // Create a horizontal container for the number
        const numberDisplay = document.createElement('div');
        numberDisplay.className = 'number-display';

        // Split and render each digit horizontally
        const digits = pastResults.winningNumber.split('');
        digits.forEach((digit, index) => {
            const pos = POSITION_KEYS[index] || 'pos1';
            const heatValue = heatmap[pos]?.[digit] ?? 0;
            const box = document.createElement('div');
            box.className = `number-box heatmap-${Math.min(9, Math.max(0, heatValue))}`;
            box.textContent = digit;
            box.title = `Heat: ${heatValue}`;
            numberDisplay.appendChild(box);
        });

        div.appendChild(numberDisplay);
        containerTop.appendChild(div);
    }

    // เลขหน้า 3 ตัว, เลขท้าย 3 ตัว
    if (Array.isArray(pastResults.front3)) {
        pastResults.front3.forEach(number => {
            const div = document.createElement('div');
            div.className = 'past-result';

            const label = document.createElement('strong');
            label.textContent = 'เลขหน้า 3 ตัว: ';
            div.appendChild(label);

            // Create a horizontal container for the number
            const numberDisplay = document.createElement('div');
            numberDisplay.className = 'number-display';
            numberDisplay.style.display = 'inline-flex'; // Make it inline to appear after the label

            // Split and render each digit horizontally
            const digits = number.split('');
            digits.forEach((digit, index) => {
                const pos = POSITION_KEYS[index] || 'pos1';
                const heatValue = heatmap[pos]?.[digit] ?? 0;
                const box = document.createElement('div');
                box.className = `number-box heatmap-${Math.min(9, Math.max(0, heatValue))}`;
                box.textContent = digit;
                box.title = `Heat: ${heatValue}`;
                numberDisplay.appendChild(box);
            });

            div.appendChild(numberDisplay);
            containerLower.appendChild(div);
        });
    }

    if (Array.isArray(pastResults.last3)) {
        pastResults.last3.forEach(number => {
            const div = document.createElement('div');
            div.className = 'past-result';

            const label = document.createElement('strong');
            label.textContent = 'เลขท้าย 3 ตัว: ';
            div.appendChild(label);

            // Create a horizontal container for the number
            const numberDisplay = document.createElement('div');
            numberDisplay.className = 'number-display';
            numberDisplay.style.display = 'inline-flex'; // Make it inline to appear after the label

            // Split and render each digit horizontally
            const digits = number.split('');
            digits.forEach((digit, index) => {
                const pos = POSITION_KEYS[index] || 'pos1';
                const heatValue = heatmap[pos]?.[digit] ?? 0;
                const box = document.createElement('div');
                box.className = `number-box heatmap-${Math.min(9, Math.max(0, heatValue))}`;
                box.textContent = digit;
                box.title = `Heat: ${heatValue}`;
                numberDisplay.appendChild(box);
            });

            div.appendChild(numberDisplay);
            containerLower.appendChild(div);
        });
    }

    if (pastResults.last2) {
        const div = document.createElement('div');
        div.className = 'past-result';

        const label = document.createElement('strong');
        label.textContent = 'เลขท้าย 2 ตัว: ';
        div.appendChild(label);

        // Create a horizontal container for the number
        const numberDisplay = document.createElement('div');
        numberDisplay.className = 'number-display';
        numberDisplay.style.display = 'inline-flex'; // Make it inline to appear after the label

        // Split and render each digit horizontally
        const digits = pastResults.last2.split('');
        digits.forEach((digit, index) => {
            const pos = POSITION_KEYS[index] || 'pos1';
            const heatValue = heatmap[pos]?.[digit] ?? 0;
            const box = document.createElement('div');
            box.className = `number-box heatmap-${Math.min(9, Math.max(0, heatValue))}`;
            box.textContent = digit;
            box.title = `Heat: ${heatValue}`;
            numberDisplay.appendChild(box);
        });

        div.appendChild(numberDisplay);
        containerLower.appendChild(div);
    }

    // รางวัลที่ 3-5 with 5 items per row
    ['prize3', 'prize4', 'prize5'].forEach((prizeKey, idx) => {
        if (Array.isArray(pastResults[prizeKey])) {
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'prize-section';

            const header = document.createElement('h3');
            header.textContent = `รางวัลที่ ${idx + 3}`;
            sectionDiv.appendChild(header);

            // Group prizes by 5 in each row
            const numbers = pastResults[prizeKey];
            for (let i = 0; i < numbers.length; i += 5) {
                const rowDiv = document.createElement('div');
                rowDiv.className = 'prize-row';

                const chunk = numbers.slice(i, i + 5);
                chunk.forEach(number => {
                    const numberDiv = document.createElement('div');
                    numberDiv.className = 'prize-item';
                    renderNumberWithHeat(number, numberDiv);
                    rowDiv.appendChild(numberDiv);
                });

                sectionDiv.appendChild(rowDiv);
            }

            container35.appendChild(sectionDiv);
        }
    });
}
// Render purchase history
function renderPurchaseHistory(historyRaw, pastResults, heatmap) {
    const container = document.getElementById('purchase-history-container');
    if (!container) return;
    container.innerHTML = '';

    if (!Array.isArray(historyRaw)) return;
    const limitedHistory = historyRaw.slice(-LIMIT_DISPLAY);

    limitedHistory.forEach(draw => {
        const entry = document.createElement('div');
        entry.className = 'history-entry';
        const header = document.createElement('h3');
        header.textContent = `งวด ${draw.draw_date || '-'}`;
        entry.appendChild(header);

        if (Array.isArray(draw.purchased_numbers)) {
            draw.purchased_numbers.forEach(purchase => {
                const item = document.createElement('div');
                item.className = 'history-item';

                const numberDisplay = document.createElement('div');
                numberDisplay.className = 'number-display';
                const digits = (purchase.number || '').split('').reverse();
                digits.forEach((digit, index) => {
                    const pos = POSITION_KEYS[index] || 'pos1';
                    const heatValue = heatmap[pos]?.[digit] ?? 0;
                    const box = document.createElement('div');
                    box.className = `number-box heatmap-${Math.min(9, Math.max(0, heatValue))}`;
                    box.textContent = digit;
                    box.title = `Heat: ${heatValue}`;
                    numberDisplay.prepend(box);
                });

                const matchInfo = document.createElement('div');
                matchInfo.className = 'match-info';
                matchInfo.textContent = purchase.match_description || '';

                item.appendChild(numberDisplay);
                item.appendChild(matchInfo);
                entry.appendChild(item);
            });
        }

        container.appendChild(entry);
    });
}

// Load draw dates from raw history
async function loadDrawDatesFromRaw() {
    const res = await fetch(API.rawHistoryList);
    const filenames = await res.text();
    return filenames
        .split('\n')
        .map(name => name.trim().match(/\d{4}-\d{2}-\d{2}/)?.[0])
        .filter(Boolean)
        .sort((a, b) => b.localeCompare(a)); // Sort by most recent
}

// Purchase History Editor Functions
async function initPurchaseHistoryEditor() {
    const [historyRaw, drawDates] = await Promise.all([
        fetch(API.purchaseHistory).then(res => res.json()),
        loadDrawDatesFromRaw()
    ]);

    window.purchaseEditorState = {
        raw: historyRaw,
        currentDraw: null,
    };

    const drawSelect = document.getElementById('draw-select');
    drawSelect.innerHTML = '';
    drawDates.forEach(date => {
        const opt = document.createElement('option');
        opt.value = date;
        opt.textContent = date;
        drawSelect.appendChild(opt);
    });

    drawSelect.addEventListener('change', (e) => {
        renderPurchaseEditorList(e.target.value);
    });

    drawSelect.dispatchEvent(new Event('change'));
}

function renderPurchaseEditorList(drawDate) {
    const listContainer = document.getElementById('number-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    window.purchaseEditorState.currentDraw = drawDate;

    let drawData = window.purchaseEditorState.raw.find(d => d.draw_date === drawDate);

    if (!drawData) {
        // Create new entry if not found
        drawData = { draw_date: drawDate, purchased_numbers: [] };
        window.purchaseEditorState.raw.push(drawData);
    }

    if (drawData.purchased_numbers.length > 0) {
        drawData.purchased_numbers.forEach((item, index) => {
            const row = document.createElement('div');
            row.className = 'purchase-item';

            const input = document.createElement('input');
            input.type = 'text';
            input.maxLength = 6;
            input.value = item.number || '';
            input.dataset.index = index;
            input.className = 'purchase-input';
            input.addEventListener('input', validateSixDigit);

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '❌';
            deleteBtn.onclick = () => deleteNumber(index);

            row.appendChild(input);
            row.appendChild(deleteBtn);

            listContainer.appendChild(row);
        });
    } else {
        // Show empty message if no numbers
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-message';
        emptyMessage.innerText = 'ยังไม่มีเลขในงวดนี้ กรุณาเพิ่มเลขใหม่';
        listContainer.appendChild(emptyMessage);
    }
}

function validateSixDigit(event) {
    const input = event.target;
    input.value = input.value.replace(/[^0-9]/g, '').slice(0, 6);
}

function deleteNumber(index) {
    const drawDate = window.purchaseEditorState.currentDraw;
    const target = window.purchaseEditorState.raw.find(d => d.draw_date === drawDate);
    if (target) {
        target.purchased_numbers.splice(index, 1);
        renderPurchaseEditorList(drawDate);
    }
}

function showToast(message) {
    const toast = document.getElementById('toast-success');
    if (!toast) return;

    toast.textContent = message || 'บันทึกสำเร็จแล้ว';
    toast.style.display = 'block';

    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// Generate report text
function generateTextReport(history, pastResults) {
    let report = 'LGE42 Report\n\n';

    history.forEach(draw => {
        report += `งวด: ${draw.draw_date}\n`;
        if (Array.isArray(draw.purchased_numbers)) {
            draw.purchased_numbers.forEach(purchase => {
                report += `- ${purchase.number || '------'}: ${purchase.match_description || 'ไม่ทราบผล'}\n`;
            });
        }
        report += '\n';
    });

    report += '---\nสรุปรวม\n';
    report += `จำนวนงวดทั้งหมด: ${history.length} งวด\n`;

    return report;
}

// Export these functions for use in other scripts
window.dashboardFunctions = {
    loadSuggestions,
    renderHeatmap,
    renderPastResults,
    renderPurchaseHistory,
    showToast,
    generateTextReport,
    loadDrawDatesFromRaw
};