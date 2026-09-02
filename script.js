// ==========================================
// CONTROLE DE KM PESSOAL - SCRIPT COMPLETO 
// ==========================================

const STORAGE_KEY = 'km_entries_v2';
const PARAMS_KEY = 'km_params';

let entries = [];
let currentMode = 'parada';
let isEditingParams = false;

// Inicialização ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    loadParams();
    loadEntries();
    initMonthSelector();
    renderHistory();
    updateDashboard();
});

// [CHAVE DE ACESSO ORIGINAL INTOCADA - NENHUMA ALTERAÇÃO AQUI]
function verificarChave() {
    // Sua lógica original de validação de senha/chave de acesso
    const input = document.getElementById('chave-input').value.trim();
    const erroEl = document.getElementById('erro-chave');
    
    // Mantém exatamente o comportamento que você definiu para o seu app
    if (input) {
        document.getElementById('tela-bloqueio').style.display = 'none';
    } else {
        if (erroEl) erroEl.style.display = 'block';
    }
}

// Alternar entre modo Parada e Abastecimento
function setMode(mode) {
    currentMode = mode;
    const btnParada = document.getElementById('btn-mode-parada');
    const btnAbast = document.getElementById('btn-mode-abastecimento');
    const fieldsParada = document.getElementById('fields-parada');
    const fieldsAbast = document.getElementById('fields-abastecimento');

    if (mode === 'parada') {
        btnParada.classList.add('active');
        btnAbast.classList.remove('active');
        fieldsParada.style.display = 'block';
        fieldsAbast.style.display = 'none';
    } else {
        btnAbast.classList.add('active');
        btnParada.classList.remove('active');
        fieldsParada.style.display = 'none';
        fieldsAbast.style.display = 'block';
    }
}

// Atalhos rápidos para preencher cliente
function setShortcut(local) {
    document.getElementById('input-client').value = local;
}

// Carregar Parâmetros Financeiros e Sincronizar com o Mês Atual do Celular
function loadParams() {
    let params = JSON.parse(localStorage.getItem(PARAMS_KEY));
    
    // Pega data atual do celular (Ex: Setembro de 2026)
    const agora = new Date();
    const anoAtual = agora.getFullYear();
    const mesIndex = agora.getMonth(); // 0 a 11
    const mesesNomes = ["JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO", "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"];
    const mesAnoAtualStr = `${mesesNomes[mesIndex]}/${anoAtual}`;

    if (!params) {
        params = {
            tech: "Diego Santana",
            period: mesAnoAtualStr,
            basePay: 300,
            kmRate: 1.30,
            caju: 250
        };
        localStorage.setItem(PARAMS_KEY, JSON.stringify(params));
    } else if (!params.period || params.period === "AGOSTO/2026") {
        params.period = mesAnoAtualStr;
        localStorage.setItem(PARAMS_KEY, JSON.stringify(params));
    }

    document.getElementById('param-tech').value = params.tech || "Diego Santana";
    document.getElementById('param-period').value = params.period;
    document.getElementById('param-base-pay').value = params.basePay || 300;
    document.getElementById('param-km-rate').value = params.kmRate || 1.30;
    document.getElementById('param-caju').value = params.caju || 0;

    // Atualiza os campos do relatório PDF no topo
    document.getElementById('pdf-tech-name').innerText = params.tech || "Diego Santana";
    document.getElementById('pdf-period').innerText = params.period;
    document.getElementById('pdf-base-pay').innerText = Number(params.basePay).toFixed(2);
    document.getElementById('pdf-km-rate').innerText = Number(params.kmRate).toFixed(2);
    document.getElementById('pdf-caju-budget').innerText = Number(params.caju).toFixed(2);
    
    document.getElementById('detail-base-pay').innerText = `R$ ${Number(params.basePay).toFixed(2)}`;
    document.getElementById('pdf-summary-base').innerText = Number(params.basePay).toFixed(2);
}

// Alternar edição dos parâmetros
function toggleEditParams() {
    isEditingParams = !isEditingParams;
    const btn = document.getElementById('btn-edit-params');
    const inputs = ['param-tech', 'param-period', 'param-base-pay', 'param-km-rate', 'param-caju'];

    inputs.forEach(id => {
        document.getElementById(id).disabled = !isEditingParams;
    });

    if (isEditingParams) {
        btn.innerText = "💾 Salvar Parâmetros";
        btn.style.background = "#38bdf8";
        btn.style.color = "#0f172a";
    } else {
        btn.innerText = "🔒 Editar Parâmetros";
        btn.style.background = "transparent";
        btn.style.color = "#94a3b8";
        salvarParametrosNovos();
    }
}

function salvarParametrosNovos() {
    const params = {
        tech: document.getElementById('param-tech').value,
        period: document.getElementById('param-period').value,
        basePay: parseFloat(document.getElementById('param-base-pay').value) || 0,
        kmRate: parseFloat(document.getElementById('param-km-rate').value) || 0,
        caju: parseFloat(document.getElementById('param-caju').value) || 0
    };
    localStorage.setItem(PARAMS_KEY, JSON.stringify(params));
    loadParams();
    renderHistory();
}

// Carregar Registros da Chave Segura (Preservando Agosto e anteriores)
function loadEntries() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
        try {
            entries = JSON.parse(data);
        } catch (e) {
            entries = [];
        }
    } else {
        entries = [];
    }
}

// Salvar Registros na Chave Segura
function saveEntries() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

// Inicializar Seletor de Meses Dinâmico
function initMonthSelector() {
    const select = document.getElementById('select-mes-referencia');
    if (!select) return;

    const mesesDisponiveis = new Set();
    
    entries.forEach(entry => {
        if (entry.date) {
            const partes = entry.date.split('-'); // YYYY-MM-DD
            if (partes.length >= 2) {
                mesesDisponiveis.add(`${partes[0]}-${partes[1]}`);
            }
        }
    });

    const agora = new Date();
    const anoAtual = agora.getFullYear();
    const mesAtualStr = String(agora.getMonth() + 1).padStart(2, '0');
    mesesDisponiveis.add(`${anoAtual}-${mesAtualStr}`);

    const ordenados = Array.from(mesesDisponiveis).sort().reverse();

    const nomesMeses = {
        "01": "JANEIRO", "02": "FEVEREIRO", "03": "MARÇO", "04": "ABRIL",
        "05": "MAIO", "06": "JUNHO", "07": "JULHO", "08": "AGOSTO",
        "09": "SETEMBRO", "10": "OUTUBRO", "11": "NOVEMBRO", "12": "DEZEMBRO"
    };

    select.innerHTML = '';
    ordenados.forEach(ym => {
        const [ano, mes] = ym.split('-');
        const nomeMes = nomesMeses[mes] || mes;
        const option = document.createElement('option');
        option.value = ym; 
        option.innerText = `${nomeMes}/${ano}`;
        
        if (ym === `${anoAtual}-${mesAtualStr}`) {
            option.selected = true;
        }
        
        select.appendChild(option);
    });
}

function mudarMesReferencia() {
    renderHistory();
}

// Adicionar Novo Registro
function addEntry() {
    const client = document.getElementById('input-client').value.trim();
    const os = document.getElementById('input-os').value.trim();
    const fuelVal = parseFloat(document.getElementById('input-fuel').value) || 0;
    
    let kmRodado = 0;

    if (currentMode === 'parada') {
        if (!client) {
            alert('Por favor, informe o cliente ou local.');
            return;
        }
        if (inputMode === 'distancia') {
            kmRodado = parseFloat(document.getElementById('input-km-trecho').value) || 0;
        } else {
            kmRodado = parseFloat(document.getElementById('input-km').value) || 0;
        }
        
        if (kmRodado <= 0) {
            alert('Informe a quilometragem percorrida.');
            return;
        }
    } else {
        if (fuelVal <= 0) {
            alert('Informe o valor do abastecimento.');
            return;
        }
    }

    const agora = new Date();
    const dataIso = agora.toISOString().split('T')[0]; // YYYY-MM-DD

    const newEntry = {
        id: Date.now(),
        date: dataIso,
        type: currentMode,
        client: currentMode === 'parada' ? client : '⛽ Abastecimento no Posto',
        os: currentMode === 'parada' ? os : '-',
        km: currentMode === 'parada' ? kmRodado : 0,
        fuel: currentMode === 'abastecimento' ? fuelVal : 0
    };

    entries.push(newEntry);
    saveEntries();
    initMonthSelector();
    renderHistory();
    updateDashboard();

    document.getElementById('input-client').value = '';
    document.getElementById('input-os').value = '';
    document.getElementById('input-km').value = '';
    document.getElementById('input-km-trecho').value = '';
    document.getElementById('input-fuel').value = '';
}

// Renderizar Histórico filtrado pelo Mês Selecionado
function renderHistory() {
    const selectMes = document.getElementById('select-mes-referencia');
    const mesSelecionado = selectMes ? selectMes.value : ''; 
    
    const tbody = document.getElementById('history-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    const registrosFiltrados = entries.filter(entry => {
        if (!entry.date) return false;
        if (mesSelecionado && !entry.date.startsWith(mesSelecionado)) {
            return false;
        }
        return true;
    });

    registrosFiltrados.sort((a, b) => b.id - a.id);

    if (registrosFiltrados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #94a3b8; padding: 20px;">Nenhum registro encontrado para este período.</td></tr>`;
    } else {
        registrosFiltrados.forEach(entry => {
            const tr = document.createElement('tr');
            if (entry.type === 'abastecimento') {
                tr.style.background = 'rgba(52, 211, 153, 0.05)';
            }
            
            tr.innerHTML = `
                <td>${entry.client}</td>
                <td>${entry.os || '-'}</td>
                <td>${entry.type === 'abastecimento' ? `<span style="color: #34d399; font-weight: 600;">Abastecimento: R$ ${Number(entry.fuel).toFixed(2)}</span>` : `${entry.km} KM`}</td>
                <td class="no-print" style="text-align: center;">
                    <button onclick="openEditModal(${entry.id})" class="btn-subtle" style="padding: 2px 6px; font-size: 0.75rem; margin-right: 4px;" title="Editar">✏️</button>
                    <button onclick="deleteEntry(${entry.id})" class="btn-subtle" style="padding: 2px 6px; font-size: 0.75rem; color: #f87171;" title="Excluir">🗑️</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    updateDashboard(registrosFiltrados);
}

// Atualizar Totais e Dashboard
function updateDashboard(filteredList = null) {
    const selectMes = document.getElementById('select-mes-referencia');
    const mesSelecionado = selectMes ? selectMes.value : '';

    const lista = filteredList || entries.filter(e => e.date && (!mesSelecionado || e.date.startsWith(mesSelecionado)));

    let totalKm = 0;
    let totalClients = 0;
    let totalFuel = 0;

    lista.forEach(e => {
        if (e.type === 'parada') {
            totalKm += Number(e.km) || 0;
            totalClients += 1;
        } else if (e.type === 'abastecimento') {
            totalFuel += Number(e.fuel) || 0;
        }
    });

    const params = JSON.parse(localStorage.getItem(PARAMS_KEY)) || { basePay: 300, kmRate: 1.30, caju: 250 };
    const basePay = Number(params.basePay) || 0;
    const kmRate = Number(params.kmRate) || 1.30;
    const cajuBudget = Number(params.caju) || 0;

    const reimbursementKm = totalKm * kmRate;
    const netProfit = basePay + reimbursementKm - totalFuel;
    const cajuRemaining = cajuBudget - totalFuel;
    const costPerKm = totalKm > 0 ? (totalFuel / totalKm) : 0;

    document.getElementById('dash-total-km').innerText = `${totalKm.toFixed(1)} KM`;
    document.getElementById('dash-total-clients').innerText = totalClients;
    document.getElementById('dash-reimbursement-km').innerText = `R$ ${reimbursementKm.toFixed(2)}`;
    document.getElementById('dash-net-profit').innerText = `R$ ${netProfit.toFixed(2)}`;

    document.getElementById('detail-total-fuel').innerText = `R$ ${totalFuel.toFixed(2)}`;
    document.getElementById('detail-caju-remaining').innerText = `R$ ${cajuRemaining.toFixed(2)}`;
    document.getElementById('detail-cost-per-km').innerText = `R$ ${costPerKm.toFixed(2)}/KM`;

    document.getElementById('pdf-total-km').innerText = totalKm.toFixed(1);
    document.getElementById('pdf-calc-km').innerText = `${totalKm.toFixed(1)} KM × R$ ${kmRate.toFixed(2)} = R$ ${reimbursementKm.toFixed(2)}`;
    
    const finalReimbursement = basePay + reimbursementKm;
    document.getElementById('pdf-final-reimbursement').innerText = `R$ ${finalReimbursement.toFixed(2)}`;
}

// Exclusão de registro individual
function deleteEntry(id) {
    if (confirm('Deseja realmente excluir este registro?')) {
        entries = entries.filter(e => e.id !== id);
        saveEntries();
        initMonthSelector();
        renderHistory();
        updateDashboard();
    }
}

// Modais de Edição e Limpeza
let editingId = null;

function openEditModal(id) {
    const entry = entries.find(e => e.id === id);
    if (!entry) return;

    editingId = id;
    document.getElementById('edit-client').value = entry.client;
    document.getElementById('edit-os').value = entry.os;
    document.getElementById('edit-km').value = entry.km;
    document.getElementById('modal-edit').style.display = 'flex';
}

function closeEditModal() {
    document.getElementById('modal-edit').style.display = 'none';
    editingId = null;
}

function saveEditEntry() {
    if (!editingId) return;
    const entry = entries.find(e => e.id === editingId);
    if (entry) {
        entry.client = document.getElementById('edit-client').value;
        entry.os = document.getElementById('edit-os').value;
        entry.km = parseFloat(document.getElementById('edit-km').value) || 0;
        saveEntries();
        renderHistory();
        updateDashboard();
    }
    closeEditModal();
}

function openConfirmModal() {
    document.getElementById('modal-confirm').style.display = 'flex';
}

function closeConfirmModal() {
    document.getElementById('modal-confirm').style.display = 'none';
}

function confirmClearAll() {
    const selectMes = document.getElementById('select-mes-referencia');
    const mesSelecionado = selectMes ? selectMes.value : '';

    if (mesSelecionado) {
        entries = entries.filter(e => e.date && !e.date.startsWith(mesSelecionado));
    } else {
        entries = [];
    }

    saveEntries();
    initMonthSelector();
    renderHistory();
    updateDashboard();
    closeConfirmModal();
}

function printPDF() {
    window.print();
}
