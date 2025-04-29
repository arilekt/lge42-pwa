// script-extension-final-clean.js
// LGE42 Dashboard - UI Enhancement Script

document.addEventListener('DOMContentLoaded', function () {
    setupTooltips();
    setupModalEvents();
    setupMenuEvents();
});

// Setup tooltips for suggestion rows
function setupTooltips() {
    document.addEventListener('mouseover', function (e) {
        const row = e.target.closest('.suggestion-row');
        if (row && !row.querySelector('.tooltip')) {
            const confidence = row.querySelector('.confidence-indicator')?.textContent || 'N/A';
            const source = row.querySelector('.source-indicator')?.textContent || 'N/A';

            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = `Confidence: ${confidence}\nMethod: ${source}`;
            tooltip.style.position = 'absolute';
            tooltip.style.top = '-40px';
            tooltip.style.left = '10px';

            row.style.position = 'relative';
            row.appendChild(tooltip);
        }
    });

    document.addEventListener('mouseout', function (e) {
        const row = e.target.closest('.suggestion-row');
        if (row) {
            const tooltip = row.querySelector('.tooltip');
            if (tooltip) tooltip.remove();
        }
    });
}

// Setup all modal-related events
function setupModalEvents() {
    // Purchase History Modal
    document.getElementById('add-number-btn')?.addEventListener('click', () => {
        const newInput = document.getElementById('new-number-input');
        const number = newInput.value.trim();

        if (!/^\d{6}$/.test(number)) {
            alert('กรุณากรอกเลข 6 หลักให้ถูกต้อง');
            return;
        }

        const drawDate = window.purchaseEditorState?.currentDraw;
        if (!drawDate) return;

        let target = window.purchaseEditorState.raw.find(d => d.draw_date === drawDate);
        if (!target) {
            target = { draw_date: drawDate, purchased_numbers: [] };
            window.purchaseEditorState.raw.push(target);
        }

        target.purchased_numbers.push({ number: number, match_description: '' });
        newInput.value = ''; // clear input
        renderPurchaseEditorList(drawDate); // re-render
    });

    document.getElementById('save-history-btn')?.addEventListener('click', async () => {
        const drawDate = window.purchaseEditorState?.currentDraw;
        if (!drawDate) return;

        const target = window.purchaseEditorState.raw.find(d => d.draw_date === drawDate);
        if (!target) return;

        const inputs = document.querySelectorAll('#number-list .purchase-input');

        const purchasedNumbers = Array.from(inputs).map(input => ({
            number: input.value.trim(),
            match_description: '' // Backend will fill this
        }));

        const payload = {
            draw_date: drawDate,
            purchased_numbers: purchasedNumbers
        };

        try {
            const response = await fetch(API.purchaseHistorySave, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                document.getElementById('purchase-history-modal').style.display = 'none';

                const updatedHistory = await fetch(API.purchaseHistory).then(res => res.json());
                const pastResults = await fetch(API.pastResults).then(res => res.json());
                renderPurchaseHistory(updatedHistory, pastResults, window.currentHeatmap);

                window.dashboardFunctions.showToast('บันทึกข้อมูลเรียบร้อยแล้ว');
            } else {
                alert('เกิดข้อผิดพลาดในการบันทึก');
            }

        } catch (error) {
            console.error('Error saving purchase history:', error);
            alert('เกิดข้อผิดพลาดในการบันทึก');
        }
    });

    document.getElementById('reset-history-btn')?.addEventListener('click', () => {
        if (confirm('ต้องการรีเซ็ตข้อมูลในหน้านี้กลับเป็นค่าเดิมหรือไม่?')) {
            const drawDate = window.purchaseEditorState?.currentDraw;
            renderPurchaseEditorList(drawDate);
        }
    });

    // Help modal
    document.getElementById('open-help')?.addEventListener('click', function() {
        if (!document.getElementById('help-modal')) {
            createHelpModal();
        }
        const helpModal = document.getElementById('help-modal');
        helpModal.style.display = 'flex';
    });

    // Close modals when clicking outside content
    document.addEventListener('click', function(e) {
        const helpModal = document.getElementById('help-modal');
        if (helpModal && e.target === helpModal) {
            helpModal.style.display = 'none';
        }
    });
}

// Setup menu action events
function setupMenuEvents() {
    document.getElementById('menu-reload-data')?.addEventListener('click', async () => {
        const res = await fetch(API.rawHistoryList);
        const text = await res.text();
        console.log('Reloaded raw data: Done');
        window.dashboardFunctions.showToast('Reloaded raw data: Done');
    });

    document.getElementById('menu-reprocess-heatmap')?.addEventListener('click', async () => {
        const heatmap = await fetch(API.heatmap).then(res => res.json());
        window.currentHeatmap = heatmap;

        const history = await fetch(API.purchaseHistory).then(res => res.json());
        const pastResults = await fetch(API.pastResults).then(res => res.json());
        
        window.dashboardFunctions.renderPurchaseHistory(history, pastResults, heatmap);
        window.dashboardFunctions.renderHeatmap(heatmap);
        console.log('✅ Heatmap Updated: Done');
        window.dashboardFunctions.showToast('Heatmap Updated');
    });

    document.getElementById('menu-export-report')?.addEventListener('click', async () => {
        const history = await fetch(API.purchaseHistory).then(res => res.json());
        const pastResults = await fetch(API.pastResults).then(res => res.json());
        console.log('Exporting report:', { history, pastResults });
        const report = window.dashboardFunctions.generateTextReport(history, pastResults);
        const blob = new Blob([report], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'lge42_report.txt';
        link.click();
    });
}

// Create Help Modal HTML
function createHelpModal() {
    const helpModalHTML = `
    <div id="help-modal" class="modal-overlay">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Help: สรุป Logic การสุ่มเลข</h3>
                <button id="close-help-modal" class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <ul class="help-list">
                    <li>
                        <span class="dot dot-blue"></span>
                        <strong>best-heatmap</strong> – สุ่มจาก digit ที่ heat สูงสุด
                        <p><em>หมายเหตุ: ดึงมาจาก heatmap</em></p>
                    </li>
                    <li>
                        <span class="dot dot-orange"></span>
                        <strong>cold-random</strong> – จาก digit ที่ heat ต่ำสุด
                        <p><em>หมายเหตุ: ตรงข้ามกับ best heat</em></p>
                    </li>
                    <li>
                        <span class="dot dot-gray"></span>
                        <strong>pure-random</strong> – ไม่มีน้ำหนัก 0-9 เท่า ๆ กัน
                        <p><em>หมายเหตุ: random ธรรมดา</em></p>
                    </li>
                    <li>
                        <span class="dot dot-yellow"></span>
                        <strong>heat-bias</strong> – ผสม heatmap กับ bias
                        <p><em>หมายเหตุ: เบรนด์ + ความนิยม</em></p>
                    </li>
                    <li>
                        <span class="dot dot-purple"></span>
                        <strong>bias-matrix</strong> – จากแมทริกซ์ทางสถิติ
                        <p><em>หมายเหตุ: historical bias</em></p>
                    </li>
                    <li>
                        <span class="dot dot-green"></span>
                        <strong>pattern-biased</strong> – ดึง pattern เช่น abcdef 15%
                        <p><em>หมายเหตุ: จากรางวัล 2-5 จริง</em></p>
                    </li>
                </ul>
            </div>
        </div>
    </div>`;
    
    document.body.insertAdjacentHTML('beforeend', helpModalHTML);
    
    // Add event listener to close button
    document.getElementById('close-help-modal').addEventListener('click', function() {
        document.getElementById('help-modal').style.display = 'none';
    });
}