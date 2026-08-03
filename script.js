// ==== SISTEMA DE BLOQUEIO ====
const CHAVE_MESTRA = "ACESSO@KM";

function verificarBloqueio() {
    if (localStorage.getItem("app_liberado") === "sim") {
        document.getElementById("tela-bloqueio").style.display = "none";
    }
}

function verificarChave() {
    let chaveDigitada = document.getElementById("chave-input").value.trim();
    
    if (chaveDigitada === CHAVE_MESTRA) {
        localStorage.setItem("app_liberado", "sim");
        document.getElementById("tela-bloqueio").style.display = "none";
    } else {
        document.getElementById("erro-chave").style.display = "block";
    }
}
// =============================

let mode = 'parada';
let paramsUnlocked = false;
let entries = JSON.parse(localStorage.getItem('km_entries_v2')) || [];

let params = JSON.parse(localStorage.getItem('km_params')) || {
    tech: '',
    period: '',
    basePay: 300,
    kmRate: 1.30,
    caju: 250
};

// Inicializa os Parâmetros
function initParamsUI() {
    document.getElementById('param-tech').value = params.tech;
    document.getElementById('param-period').value = params.period;
    document.getElementById('param-base-pay').value = params.basePay;
    document.getElementById('param-km-rate').value = params.kmRate;
    document.getElementById('param-caju').value = params.caju;

    document.getElementById('pdf-tech-name').innerText = params.tech || '___________________';
    document.getElementById('pdf-period').innerText = params.period || '___________________';
    document.getElementById('pdf-base-pay').innerText = parseFloat(params.basePay).toFixed(2);
    document.getElementById('pdf-km-rate').innerText = parseFloat(params.kmRate).toFixed(2);
    document.getElementById('pdf-caju-budget').innerText = parseFloat(params.caju).toFixed(2);
    document.getElementById('pdf-summary-base').innerText = parseFloat(params.basePay).toFixed(2);
}

// Edição de Parâmetros
function toggleEditParams() {
    paramsUnlocked = !paramsUnlocked;
    const inputIds = ['param-tech', 'param-period', 'param-base-pay', 'param-km-rate', 'param-caju'];
    const btn = document.getElementById('btn-edit-params');

    inputIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = !paramsUnlocked;
    });

    if (paramsUnlocked) {
        btn.innerText = '🔓 Salvar Parâmetros';
        btn.style.background = '#10b981';
        btn.style.color = '#fff';
    } else {
        params.tech = document.getElementById('param-tech').value.trim();
        params.period = document.getElementById('param-period').value.trim();
        params.basePay = parseFloat(document.getElementById('param-base-pay').value) || 0;
        params.kmRate = parseFloat(document.getElementById('param-km-rate').value) || 0;
        params.caju = parseFloat(document.getElementById('param-caju').value) || 0;

        localStorage.setItem('km_params', JSON.stringify(params));

        btn.innerText = '🔒 Editar Parâmetros';
        btn.style.background = '#2a3447';
        btn.style.color = 'var(--text-main)';

        initParamsUI();
        calculateTotals();
    }
}

// Modos
function setMode(newMode) {
    mode = newMode;
    document.getElementById('btn-mode-parada').classList.toggle('active', mode === 'parada');
    document.getElementById('btn-mode-abastecimento').classList.toggle('active', mode === 'abastecimento');

    document.getElementById('fields-parada').style.display = mode === 'parada' ? 'block' : 'none';
    document.getElementById('fields-abastecimento').style.display = mode === 'abastecimento' ? 'block' : 'none';
}

function setShortcut(location) {
    document.getElementById('input-client').value = location;
}

// Lançamento
function addEntry() {
    if (mode === 'parada') {
        const client = document.getElementById('input-client').value.trim();
        const os = document.getElementById('input-os').value.trim();
        
        // Substitui vírgula por ponto para evitar erros matemáticos com teclados de celular
        let kmInputString = document.getElementById('input-km').value.replace(',', '.');
        const inputKmVal = parseFloat(kmInputString) || 0;

        if (!client) {
            alert('Informe o cliente ou local.');
            return;
        }

        entries.push({
            id: Date.now(),
            type: 'parada',
            client,
            os: os || '-',
            km: inputKmVal
        });
    } else {
        let fuelString = document.getElementById('input-fuel').value.replace(',', '.');
        const fuel = parseFloat(fuelString) || 0;
        
        if (fuel <= 0) {
            alert('Informe um valor de abastecimento válido.');
            return;
        }

        entries.push({
            id: Date.now(),
            type: 'abastecimento',
            valor: fuel
        });
    }

    saveAndRender();
    clearInputs();
}

// Exclusão Única
function deleteEntry(id) {
    entries = entries.filter(e => e.id !== id);
    saveAndRender();
}

// Modal Limpar Tudo
function openConfirmModal() {
    document.getElementById('modal-confirm').style.display = 'flex';
}

function closeConfirmModal() {
    document.getElementById('modal-confirm').style.display = 'none';
}

function confirmClearAll() {
    entries = [];
    localStorage.removeItem('km_entries_v2');
    
    saveAndRender();
    closeConfirmModal();
}

// Modal de Edição de Registro
function openEditModal(id) {
    const item = entries.find(e => e.id == id);
    if (!item || item.type === 'abastecimento') return;

    document.getElementById('edit-id').value = item.id;
    document.getElementById('edit-client').value = item.client;
    document.getElementById('edit-os').value = item.os;
    document.getElementById('edit-km').value = item.km;

    document.getElementById('modal-edit').style.display = 'flex';
}

function closeEditModal() {
    document.getElementById('modal-edit').style.display = 'none';
}

function saveEditEntry() {
    const id = parseInt(document.getElementById('edit-id').value);
    const item = entries.find(e => e.id === id);

    if (item) {
        item.client = document.getElementById('edit-client').value.trim() || item.client;
        item.os = document.getElementById('edit-os').value.trim() || '-';
        
        let kmEditString = document.getElementById('edit-km').value.replace(',', '.');
        item.km = parseFloat(kmEditString) || 0;

        saveAndRender();
    }
    closeEditModal();
}

function saveAndRender() {
    localStorage.setItem('km_entries_v2', JSON.stringify(entries));
    renderHistory();
    calculateTotals();
}

function clearInputs() {
    document.getElementById('input-client').value = '';
    document.getElementById('input-os').value = '';
    document.getElementById('input-km').value = '';
    document.getElementById('input-fuel').value = '';
}

// Render da Tabela Clean
function renderHistory() {
    const tbody = document.getElementById('history-body');
    tbody.innerHTML = '';

    if (entries.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px 0; color: var(--text-sub);">Nenhum registro efetuado este mês.</td></tr>';
        return;
    }

    entries.forEach(item => {
        const tr = document.createElement('tr');

        if (item.type === 'abastecimento') {
            tr.classList.add('row-abastecimento');
            tr.innerHTML = `
                <td><span class="badge-posto-amber">⛽ Abastecimento (R$ ${item.valor.toFixed(2)})</span></td>
                <td>-</td>
                <td>-</td>
                <td class="no-print"><button class="btn-icon-subtle" onclick="deleteEntry(${item.id})">×</button></td>
            `;
        } else {
            tr.innerHTML = `
                <td class="clickable-cell" onclick="openEditModal(${item.id})" title="Clique para editar">${item.client}</td>
                <td>${item.os}</td>
                <td>+${item.km} KM</td>
                <td class="no-print"><button class="btn-icon-subtle" onclick="deleteEntry(${item.id})">×</button></td>
            `;
        }
        tbody.appendChild(tr);
    });
}

// Cálculos em Tempo Real
function calculateTotals() {
    let totalKm = 0;
    let totalFuel = 0;
    let clientCount = 0;

    const shortcuts = ['casa', 'empresa', 'trabalho'];

    const kmRateInput = parseFloat(document.getElementById('param-km-rate').value) || 0;
    const basePayInput = parseFloat(document.getElementById('param-base-pay').value) || 0;
    const cajuInput = parseFloat(document.getElementById('param-caju').value) || 0;

    entries.forEach(item => {
        if (item.type === 'parada') {
            totalKm += item.km;

            const nameLower = item.client.trim().toLowerCase();
            if (!shortcuts.includes(nameLower)) {
                clientCount++;
            }
        }
        if (item.type === 'abastecimento') {
            totalFuel += item.valor;
        }
    });

    const kmReimbursement = totalKm * kmRateInput;
    const netProfit = basePayInput + kmReimbursement;

    const cajuRemaining = Math.max(0, cajuInput - totalFuel);
    const costPerKm = totalKm > 0 ? (totalFuel / totalKm) : 0;

    document.getElementById('dash-total-km').innerText = `${totalKm} KM`;
    document.getElementById('dash-total-clients').innerText = clientCount;
    document.getElementById('dash-reimbursement-km').innerText = `R$ ${kmReimbursement.toFixed(2)}`;
    document.getElementById('dash-net-profit').innerText = `R$ ${netProfit.toFixed(2)}`;

    document.getElementById('detail-base-pay').innerText = `R$ ${basePayInput.toFixed(2)}`;
    document.getElementById('detail-total-fuel').innerText = `R$ ${totalFuel.toFixed(2)}`;
    document.getElementById('detail-caju-remaining').innerText = `R$ ${cajuRemaining.toFixed(2)}`;
    document.getElementById('detail-cost-per-km').innerText = `R$ ${costPerKm.toFixed(2)}/KM`;

    document.getElementById('pdf-total-km').innerText = totalKm;
    document.getElementById('pdf-calc-km').innerText = `${totalKm} KM × R$ ${kmRateInput.toFixed(2)} = R$ ${kmReimbursement.toFixed(2)}`;
    document.getElementById('pdf-final-reimbursement').innerText = `R$ ${netProfit.toFixed(2)}`;
}

function printPDF() {
    window.print();
}

document.addEventListener('DOMContentLoaded', () => {
    verificarBloqueio(); // Chama a verificação da chave logo ao carregar
    initParamsUI();
    renderHistory();
    calculateTotals();

    const paramInputs = ['param-km-rate', 'param-base-pay', 'param-caju', 'param-tech', 'param-period'];
    paramInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', calculateTotals);
        }
    });
});
