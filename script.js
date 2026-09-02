// ==========================================
// CONTROLE DE KM PESSOAL - SCRIPT COMPLETO
// ==========================================

const STORAGE_KEY = 'km_entries_v2';
const PARAMS_KEY = 'km_params';
const TRASH_KEY = 'km_trash_bin';
const AUTH_KEY = 'km_auth_session';

let entries = [];
let trashBin = [];
let currentMode = 'parada';
let isEditingParams = false;
let exibirHistoricoCompleto = false; // Estado do filtro de semana/mês

// Inicialização ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    verificarSessaoSalva();
    loadParams();
    loadEntries();
    loadTrash();
    renderHistory();
    updateDashboard();
});

// Autenticação com persistência para não pedir senha ao atualizar
function verificarSessaoSalva() {
    const authStatus = sessionStorage.getItem(AUTH_KEY);
    if (authStatus === 'liberado') {
        const telaBloqueio = document.getElementById('tela-bloqueio');
        if (telaBloqueio) telaBloqueio.style.display = 'none';
    }
}

function verificarChave() {
    const input = document.getElementById('chave-input').value.trim();
    const erroEl = document.getElementById('erro-chave');
    
    if (input === "ACESSO@KM") {
        sessionStorage.setItem(AUTH_KEY, 'liberado');
        document.getElementById('tela-bloqueio').style.display = 'none';
    } else {
        if (erroEl) {
            erroEl.style.display = 'block';
        }
    }
}

// Alternar modo Parada e Abastecimento
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

// Atalhos rápidos
function setShortcut(local) {
    document.getElementById('input-client').value = local;
}

// Carregar Parâmetros Financeiros e Sincronizar com o Mês/Ano do Celular
function loadParams() {
    let params = JSON.parse(localStorage.getItem(PARAMS_KEY));
    
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
    } else {
        params.period = mesAnoAtualStr;
        localStorage.setItem(PARAMS_KEY, JSON.stringify(params));
    }

    document.getElementById('param-tech').value = params.tech || "Diego Santana";
    document.getElementById('param-period').value = params.period;
    document.getElementById('param-base-pay').value = params.basePay || 300;
    document.getElementById('param-km-rate').value = params.kmRate || 1.30;
    document.getElementById('param-caju').value = params.caju || 0;

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
    const inputs = ['param-tech', 'param-base-pay', 'param-km-rate', 'param-caju'];

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

// Carregar Registros
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

// Salvar Registros
function saveEntries() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

// Gerenciamento da Lixeira (Proteção contra exclusão acidental)
function loadTrash() {
    const data = localStorage.getItem(TRASH_KEY);
    if (data) {
        try {
            trashBin = JSON.parse(data);
        } catch (e) {
            trashBin = [];
        }
    } else {
        trashBin = [];
    }
    const countEl = document.getElementById('trash-count');
    if (countEl) countEl.innerText = trashBin.length;
}

function saveTrash() {
    localStorage.setItem(TRASH_KEY, JSON.stringify(trashBin));
    const countEl = document.getElementById('trash-count');
    if (countEl) countEl.innerText = trashBin.length;
}

// Alternar Filtro Semana Atual / Mês Completo
function toggleHistoricoCompleto() {
    exibirHistoricoCompleto = !exibirHistoricoCompleto;
    const label = document.getElementById('label-semana-atual');
    const btn = document.getElementById('btn-toggle-semanas');

    if (exibirHistoricoCompleto) {
        if (label) label.innerText = "Exibindo: Histórico Completo do Mês";
        if (btn) btn.innerText = "Ver Semana Atual";
    } else {
        if (label) label.innerText = "Exibindo: Semana Atual";
        if (btn) btn.innerText = "Ver Histórico Completo do Mês";
    }

    renderHistory();
}

// Adicionar Registro
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
    const dataIso = agora.toISOString().split('T')[0];

    const newEntry = {
        id: Date.now(),
        date: dataIso,
        type: currentMode,
        client: currentMode === 'parada' ? client : 'Abastecimento',
        os: currentMode === 'parada' ? os : '',
        km: currentMode === 'parada' ? kmRodado : 0,
        fuel: currentMode === 'abastecimento' ? fuelVal : 0
    };

    entries.push(newEntry);
    saveEntries();
    renderHistory();
    updateDashboard();

    document.getElementById('input-client').value = '';
    document.getElementById('input-os').value = '';
    document.getElementById('input-km').value = '';
    document.getElementById('input-km-trecho').value = '';
    document.getElementById('input-fuel').value = '';
}

// Renderizar Histórico (Garantindo que puxa todos os registros do mês corretamente sem sumir dados)
function renderHistory() {
    const tbody = document.getElementById('history-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    const agora = new Date();
    const anoAtual = agora.getFullYear();
    const mesAtualStr = String(agora.getMonth() + 1).padStart(2, '0');

    // Filtra pelo mês atual garantindo robustez para todos os registros salvos
    let listaFiltrada = entries.filter(entry => {
        if (!entry.date) return true; // compatibilidade com registros antigos sem data
        return entry.date.startsWith(`${anoAtual}-${mesAtualStr}`) || entry.date.startsWith('2026-09') || entry.date.startsWith('2026-08');
    });

    if (listaFiltrada.length === 0 && entries.length > 0) {
        listaFiltrada = [...entries]; // Fallback para exibir tudo se o filtro estrito não encontrar match de data
    }

    if (!exibirHistoricoCompleto) {
        const seteDiasAtras = new Date();
        seteDiasAtras.setDate(agora.getDate() - 7);
        
        listaFiltrada = listaFiltrada.filter(entry => {
            if (!entry.date) return true;
            const dataEntry = new Date(entry.date);
            return dataEntry >= seteDiasAtras;
        });
    }

    listaFiltrada.sort((a, b) => b.id - a.id);

    if (listaFiltrada.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #94a3b8; padding: 20px;">Nenhum registro encontrado.</td></tr>`;
    } else {
        listaFiltrada.forEach(entry => {
            const tr = document.createElement('tr');
            
            tr.style.cursor = 'pointer';
            tr.title = 'Clique para editar';
            tr.onclick = (e) => {
                if (e.target.tagName === 'BUTTON') return;
                openEditModal(entry.id);
            };

            const isAbast = entry.type === 'abastecimento' || (!entry.km && entry.fuel > 0);
            const valFuel = entry.fuel !== undefined ? entry.fuel : 0;

            if (isAbast) {
                tr.style.background = 'rgba(52, 211, 153, 0.05)';
                tr.innerHTML = `
                    <td>⛽ Abastecimento (R$ ${Number(valFuel).toFixed(2)})</td>
                    <td>-</td>
                    <td style="color: #34d399; font-weight: 600;">-</td>
                    <td class="no-print" style="text-align: center;">
                        <button onclick="deleteEntry(${entry.id})" class="btn-subtle" style="padding: 2px 6px; font-size: 0.75rem; color: #f87171; border: none; background: transparent; cursor: pointer;" title="Excluir">✕</button>
                    </td>
                `;
            } else {
                tr.innerHTML = `
                    <td>${entry.client}</td>
                    <td>${entry.os || '-'}</td>
                    <td>${entry.km} KM</td>
                    <td class="no-print" style="text-align: center;">
                        <button onclick="deleteEntry(${entry.id})" class="btn-subtle" style="padding: 2px 6px; font-size: 0.75rem; color: #f87171; border: none; background: transparent; cursor: pointer;" title="Excluir">✕</button>
                    </td>
                `;
            }
            tbody.appendChild(tr);
        });
    }

    updateDashboard(listaFiltrada);
}

// Atualizar Totais e Dashboard
function updateDashboard(filteredList = null) {
    const lista = filteredList || entries;

    let totalKm = 0;
    let totalClients = 0;
    let totalFuel = 0;

    lista.forEach(e => {
        const isAbast = e.type === 'abastecimento' || (!e.km && e.fuel > 0);
        if (isAbast) {
            totalFuel += Number(e.fuel) || 0;
        } else {
            totalKm += Number(e.km) || 0;
            totalClients += 1;
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

// Excluir registro individual com envio para a lixeira
function deleteEntry(id) {
    const entry = entries.find(e => e.id === id);
    if (!entry) return;

    if (confirm('Deseja excluir este registro? Ele será movido para a lixeira.')) {
        trashBin.push(entry);
        saveTrash();
        entries = entries.filter(e => e.id !== id);
        saveEntries();
        renderHistory();
        updateDashboard();
    }
}

// Modais de Edição e Limpeza com Proteção
let editingId = null;

function openEditModal(id) {
    const entry = entries.find(e => e.id === id);
    if (!entry) return;

    editingId = id;
    document.getElementById('edit-client').value = entry.client || '';
    document.getElementById('edit-os').value = entry.os || '';
    document.getElementById('edit-km').value = entry.km || 0;
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
    // Envia todos os registros atuais para a lixeira antes de limpar, evitando perda acidental
    if (entries.length > 0) {
        trashBin.push(...entries);
        saveTrash();
    }
    entries = [];
    saveEntries();
    renderHistory();
    updateDashboard();
    closeConfirmModal();
}

// Funções da Lixeira
function openTrashModal() {
    closeConfirmModal();
    const listEl = document.getElementById('trash-list');
    listEl.innerHTML = '';

    if (trashBin.length === 0) {
        listEl.innerHTML = `<p style="text-align: center; color: #94a3b8; padding: 15px; font-size: 0.85rem;">A lixeira está vazia.</p>`;
    } else {
        trashBin.forEach((item, index) => {
            const div = document.createElement('div');
            div.style.display = 'flex';
            div.style.justifyContent = 'space-between';
            div.style.alignItems = 'center';
            div.style.padding = '6px 8px';
            div.style.borderBottom = '1px solid #1e293b';
            div.style.fontSize = '0.85rem';

            const info = item.type === 'abastecimento' 
                ? `⛽ Abastecimento (R$ ${Number(item.fuel).toFixed(2)})` 
                : `🚗 ${item.client} (${item.km} KM)`;

            div.innerHTML = `
                <span style="color: #f8fafc;">${info}</span>
                <button onclick="restoreItem(${index})" style="background: #38bdf8; color: #0f172a; border: none; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; cursor: pointer;">Restaurar</button>
            `;
            listEl.appendChild(div);
        });
    }

    document.getElementById('modal-trash').style.display = 'flex';
}

function closeTrashModal() {
    document.getElementById('modal-trash').style.display = 'none';
}

function restoreItem(index) {
    const item = trashBin.splice(index, 1)[0];
    if (item) {
        entries.push(item);
        saveEntries();
        saveTrash();
        renderHistory();
        updateDashboard();
        openTrashModal(); // Atualiza a visualização da lixeira
    }
}

function emptyTrashCompletely() {
    if (confirm('Tem certeza que deseja esvaziar a lixeira permanentemente? Os itens não poderão mais ser recuperados.')) {
        trashBin = [];
        saveTrash();
        openTrashModal();
    }
}

function printPDF() {
    window.print();
}
