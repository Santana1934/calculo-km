// --- CONTROLE DE ACESSO COM SENHA E OLHINHO ---
const CHAVE_MESTRE = "ACESSO@KM";

function verificarChave() {
    const inputEl = document.getElementById('chave-input');
    const valorDigitado = inputEl ? inputEl.value.trim() : "";

    if (valorDigitado === CHAVE_MESTRE) {
        const tela = document.getElementById('tela-bloqueio');
        if (tela) tela.style.display = 'none';
        localStorage.setItem('app_liberado', 'true');
        inicializarApp();
    } else {
        const erroEl = document.getElementById('erro-chave');
        if (erroEl) erroEl.style.display = 'block';
    }
}

window.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('app_liberado') === 'true') {
        const tela = document.getElementById('tela-bloqueio');
        if (tela) tela.style.display = 'none';
        inicializarApp();
    } else {
        const tela = document.getElementById('tela-bloqueio');
        if (tela) tela.style.display = 'flex';
    }
});

// --- VARIÁVEIS GLOBAIS E ESTADO ---
let registros = JSON.parse(localStorage.getItem('controle_km_registros')) || [];
let parametros = JSON.parse(localStorage.getItem('controle_km_params')) || {};

let mesSelecionadoHistorico = "AGOSTO/2026"; 
let exibirHistoricoCompletoMes = true; 

const nomesMeses = [
    "JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO", 
    "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"
];

function obterMesAnoAtual() {
    const agora = new Date();
    return `${nomesMeses[agora.getMonth()]}/${agora.getFullYear()}`;
}

function inicializarApp() {
    // DIAGNÓSTICO DIRETO NA TELA PARA VOCÊ VER O QUE ESTÁ SALVO
    console.log("Total de registros no localStorage:", registros.length);
    if (registros.length === 0) {
        alert("ALERTA: O armazenamento do app está VAZIO (0 registros encontrados). O PWA pode ter resetado o cache.");
    }

    carregarParametros();
    popularSeletorMeses();
    renderHistory();
    atualizarDashboard();
}

// --- PARÂMETROS FINANCEIROS E MESES ---
function carregarParametros() {
    const mesAtualAutomatico = obterMesAnoAtual();
    
    document.getElementById('param-tech').value = parametros.tecnico || "Diego Santana";
    document.getElementById('param-period').value = mesAtualAutomatico;
    document.getElementById('param-base-pay').value = parametros.ajudaCusto !== undefined ? parametros.ajudaCusto : 300;
    document.getElementById('param-km-rate').value = parametros.taxaKm !== undefined ? parametros.taxaKm : 1.30;
    document.getElementById('param-caju').value = parametros.caju !== undefined ? parametros.caju : 250;
}

function toggleEditParams() {
    const inputs = ['param-tech', 'param-base-pay', 'param-km-rate', 'param-caju'];
    const btn = document.getElementById('btn-edit-params');
    const isDisabled = document.getElementById('param-tech').disabled;

    inputs.forEach(id => {
        document.getElementById(id).disabled = !isDisabled;
    });

    if (isDisabled) {
        btn.textContent = "💾 Salvar Parâmetros";
        btn.style.background = "#34d399";
        btn.style.color = "#0f172a";
    } else {
        btn.textContent = "🔒 Editar Parâmetros";
        btn.style.background = "";
        btn.style.color = "";
        salvarParametros();
    }
}

function salvarParametros() {
    parametros = {
        tecnico: document.getElementById('param-tech').value || "Diego Santana",
        mesAno: obterMesAnoAtual(),
        ajudaCusto: parseFloat(document.getElementById('param-base-pay').value) || 0,
        taxaKm: parseFloat(document.getElementById('param-km-rate').value) || 1.30,
        caju: parseFloat(document.getElementById('param-caju').value) || 0
    };
    localStorage.setItem('controle_km_params', JSON.stringify(parametros));
    atualizarDashboard();
    renderHistory();
}

// --- MODOS DE REGISTRO ---
let modoAtual = 'parada';

function setMode(mode) {
    modoAtual = mode;
    const btnParada = document.getElementById('btn-mode-parada');
    const btnAbastecimento = document.getElementById('btn-mode-abastecimento');
    const fieldsParada = document.getElementById('fields-parada');
    const fieldsAbastecimento = document.getElementById('fields-abastecimento');

    if (mode === 'parada') {
        btnParada.classList.add('active');
        btnAbastecimento.classList.remove('active');
        fieldsParada.style.display = 'block';
        fieldsAbastecimento.style.display = 'none';
    } else {
        btnAbastecimento.classList.add('active');
        btnParada.classList.remove('active');
        fieldsParada.style.display = 'none';
        fieldsAbastecimento.style.display = 'block';
    }
}

function setShortcut(local) {
    document.getElementById('input-client').value = local;
}

// --- ADICIONAR REGISTROS ---
function addEntry() {
    const dataAtual = new Date();
    const mesAnoRegistro = obterMesAnoAtual();
    
    let novoRegistro = {
        id: Date.now(),
        tipo: modoAtual,
        data: dataAtual.toISOString(),
        mesAno: mesAnoRegistro
    };

    if (modoAtual === 'parada') {
        const cliente = document.getElementById('input-client').value.trim();
        const os = document.getElementById('input-os').value.trim();

        if (!cliente) {
            alert('Por favor, informe o Cliente ou Local.');
            return;
        }

        let kmRodado = parseFloat(document.getElementById('input-km-trecho').value);
        if (isNaN(kmRodado) || kmRodado <= 0) {
            alert('Informe a distância correta do trecho.');
            return;
        }

        novoRegistro.cliente = cliente;
        novoRegistro.os = os || '-';
        novoRegistro.kmRodado = kmRodado;

        document.getElementById('input-client').value = '';
        document.getElementById('input-os').value = '';
        document.getElementById('input-km-trecho').value = '';

    } else {
        const valorFuel = parseFloat(document.getElementById('input-fuel').value);
        if (isNaN(valorFuel) || valorFuel <= 0) {
            alert('Informe o valor válido do abastecimento.');
            return;
        }
        novoRegistro.cliente = "⛽ Abastecimento";
        novoRegistro.os = "-";
        novoRegistro.kmRodado = 0;
        novoRegistro.valorAbastecimento = valorFuel;

        document.getElementById('input-fuel').value = '';
    }

    registros.push(novoRegistro);
    localStorage.setItem('controle_km_registros', JSON.stringify(registros));
    
    popularSeletorMeses();
    renderHistory();
    atualizarDashboard();
}

// --- GERENCIAMENTO DE MESES E HISTÓRICO ---
function popularSeletorMeses() {
    const select = document.getElementById('select-mes-referencia');
    if (!select) return;

    const mesesSet = new Set();
    mesesSet.add("AGOSTO/2026");
    mesesSet.add("SETEMBRO/2026");
    
    registros.forEach(r => {
        if (r.mesAno) {
            mesesSet.add(r.mesAno.toUpperCase());
        } else if (r.data) {
            const d = new Date(r.data);
            if (!isNaN(d)) {
                mesesSet.add(`${nomesMeses[d.getMonth()]}/${d.getFullYear()}`);
            }
        }
    });

    select.innerHTML = '';
    mesesSet.forEach(mes => {
        const option = document.createElement('option');
        option.value = mes;
        option.textContent = `Mês: ${mes}`;
        if (mes === mesSelecionadoHistorico) {
            option.selected = true;
        }
        select.appendChild(option);
    });
}

function mudarMesReferencia() {
    const select = document.getElementById('select-mes-referencia');
    if (select) {
        mesSelecionadoHistorico = select.value;
        exibirHistoricoCompletoMes = true; 
        renderHistory();
        atualizarDashboard();
    }
}

function toggleHistoricoCompleto() {
    exibirHistoricoCompletoMes = !exibirHistoricoCompletoMes;
    const btn = document.getElementById('btn-toggle-semanas');
    const labelSemana = document.getElementById('label-semana-atual');
    if (exibirHistoricoCompletoMes) {
        if(btn) btn.textContent = "Mostrar Apenas Semana Atual";
        if(labelSemana) labelSemana.textContent = `Exibindo: Mês Completo (${mesSelecionadoHistorico})`;
    } else {
        if(btn) btn.textContent = "Ver Histórico Completo do Mês";
        if(labelSemana) labelSemana.textContent = "Exibindo: Semana Atual";
    }
    renderHistory();
}

function filtrarRegistrosAtuais() {
    const mesAlvo = (mesSelecionadoHistorico || "AGOSTO/2026").toUpperCase();
    
    let filtrados = registros.filter(r => {
        let dataStr = r.data || "";
        let mesInformado = r.mesAno ? r.mesAno.toUpperCase() : "";

        if (mesAlvo.includes("AGOSTO")) {
            if (mesInformado.includes("AGO") || dataStr.includes("-08-") || dataStr.includes("/08/")) {
                return true;
            }
        }
        
        if (mesAlvo.includes("SETEMBRO")) {
            if (mesInformado.includes("SET") || dataStr.includes("-09-") || dataStr.includes("/09/")) {
                return true;
            }
        }

        return mesInformado === mesAlvo;
    });

    if (!exibirHistoricoCompletoMes) {
        const agora = new Date();
        const inicioSemana = new Date(agora);
        inicioSemana.setDate(agora.getDate() - agora.getDay()); 
        inicioSemana.setHours(0, 0, 0, 0);

        filtrados = filtrados.filter(r => {
            const dataReg = new Date(r.data);
            return dataReg >= inicioSemana;
        });
    }

    return filtrados;
}

// --- RENDERIZAR TABELA E DASHBOARD ---
function renderHistory() {
    const tbody = document.getElementById('history-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    const dadosFiltrados = filtrarRegistrosAtuais();

    if (dadosFiltrados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #94a3b8; padding: 20px;">Nenhum registro encontrado para este período. (Total gravado geral: ${registros.length})</td></tr>`;
        atualizarTotaisPDF(0, 0);
        return;
    }

    let totalKmPeriodo = 0;

    dadosFiltrados.forEach(reg => {
        const tr = document.createElement('tr');
        const dataFormatada = reg.data ? new Date(reg.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '';
        
        let kmTexto = reg.tipo === 'abastecimento' ? `<span style="color: #34d399;">Abastecimento (R$ ${(reg.valorAbastecimento || 0).toFixed(2)})</span>` : `+${(reg.kmRodado || 0).toFixed(1)} KM`;
        if (reg.tipo === 'parada' || !reg.tipo) totalKmPeriodo += (reg.kmRodado || 0);

        tr.innerHTML = `
            <td>${reg.cliente} <br><small style="color: #94a3b8;">${dataFormatada}</small></td>
            <td>${reg.os || '-'}</td>
            <td><strong>${kmTexto}</strong></td>
            <td class="no-print">
                <button class="btn-delete" onclick="deletarRegistro(${reg.id})" title="Excluir">✕</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    atualizarTotaisPDF(totalKmPeriodo, dadosFiltrados);
}

function atualizarDashboard() {
    const dadosMes = filtrarRegistrosAtuais();

    let totalKm = 0;
    let totalAbastecimento = 0;
    const clientesSet = new Set();

    dadosMes.forEach(r => {
        if (r.tipo === 'parada' || !r.tipo) {
            totalKm += (r.kmRodado || 0);
            if (r.cliente && !r.cliente.includes('Casa') && !r.cliente.includes('Empresa') && !r.cliente.includes('Abastecimento')) {
                clientesSet.add(r.cliente);
            }
        } else if (r.tipo === 'abastecimento') {
            totalAbastecimento += (r.valorAbastecimento || 0);
        }
    });

    const taxaKm = parametros.taxaKm !== undefined ? parametros.taxaKm : 1.27;
    const ajudaCusto = parametros.ajudaCusto !== undefined ? parametros.ajudaCusto : 300;
    const cajuTotal = parametros.caju !== undefined ? parametros.caju : 250;

    const reembolsoKm = totalKm * taxaKm;
    const sobraLiquida = ajudaCusto + reembolsoKm - totalAbastecimento;
    const cartaoRestante = cajuTotal - totalAbastecimento;
    const custoPorKm = totalKm > 0 ? (totalAbastecimento / totalKm) : 0;

    document.getElementById('dash-total-km').textContent = `${totalKm.toFixed(1)} KM`;
    document.getElementById('dash-total-clients').textContent = clientesSet.size;
    document.getElementById('dash-reimbursement-km').textContent = `R$ ${reimbursementFormat(reembolsoKm)}`;
    document.getElementById('dash-net-profit').textContent = `R$ ${reimbursementFormat(sobraLiquida)}`;

    document.getElementById('detail-base-pay').textContent = `R$ ${ajudaCusto.toFixed(2)}`;
    document.getElementById('detail-total-fuel').textContent = `R$ ${totalAbastecimento.toFixed(2)}`;
    document.getElementById('detail-caju-remaining').textContent = `R$ ${cartaoRestante.toFixed(2)}`;
    document.getElementById('detail-cost-per-km').textContent = `R$ ${custoPorKm.toFixed(2)}/KM`;
}

function reimbursementFormat(val) {
    return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function atualizarTotaisPDF(totalKm, dados) {
    const taxaKm = parametros.taxaKm !== undefined ? parametros.taxxKm : 1.27;
    const ajudaCusto = parametros.ajudaCusto !== undefined ? parametros.ajudaCusto : 300;
    const reembolsoKm = totalKm * taxaKm;
    const totalGeral = reembolsoKm + ajudaCusto;

    document.getElementById('pdf-tech-name').textContent = parametros.tecnico || "Diego Santana";
    document.getElementById('pdf-period').textContent = mesSelecionadoHistorico || "AGOSTO/2026";
    document.getElementById('pdf-base-pay').textContent = ajudaCusto.toFixed(2);
    document.getElementById('pdf-km-rate').textContent = taxaKm.toFixed(2);
    document.getElementById('pdf-caju-budget').textContent = (parametros.caju !== undefined ? parametros.caju : 250).toFixed(2);

    document.getElementById('pdf-total-km').textContent = totalKm.toFixed(1);
    document.getElementById('pdf-calc-km').textContent = `${totalKm.toFixed(1)} KM × R$ ${taxaKm.toFixed(2)} = R$ ${reembolsoKm.toFixed(2)}`;
    document.getElementById('pdf-summary-base').textContent = ajudaCusto.toFixed(2);
    document.getElementById('pdf-final-reimbursement').textContent = `R$ ${totalGeral.toFixed(2)}`;
}

function deletarRegistro(id) {
    if (confirm('Deseja realmente apagar este registro?')) {
        registros = registros.filter(r => r.id !== id);
        localStorage.setItem('controle_km_registros', JSON.stringify(registros));
        renderHistory();
        atualizarDashboard();
    }
}

// --- IMPRESSÃO / PDF ---
function printPDF() {
    exibirHistoricoCompletoMes = true;
    renderHistory();
    window.print();
}
