// --- CONTROLE DE ACESSO E SEGURANÇA ---
const CHAVE_MESTRE = "102030"; // Defina sua senha aqui se necessário, ou deixe livre

function verificarChave() {
    const input = document.getElementById('chave-input').value;
    if (input === CHAVE_MESTRE || CHAVE_MESTRE === "") {
        document.getElementById('tela-bloqueio').style.display = 'none';
        localStorage.setItem('app_liberado', 'true');
    } else {
        document.getElementById('erro-chave').style.display = 'block';
    }
}

window.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('app_liberado') === 'true' || CHAVE_MESTRE === "") {
        document.getElementById('tela-bloqueio').style.display = 'none';
    }
    inicializarApp();
});

// --- VARIÁVEIS GLOBAIS E ESTADO ---
let registros = JSON.parse(localStorage.getItem('controle_km_registros')) || [];
let parametros = JSON.parse(localStorage.getItem('controle_km_params')) || {};
let mesSelecionadoHistorico = ""; // Se vazio, usa o mês atual
let exibirHistoricoCompletoMes = false; // Alterna entre semana atual e mês todo

// Meses do ano para formatação automática
const nomesMeses = [
    "JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO", 
    "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"
];

function inicializarApp() {
    carregarParametros();
    popularSeletorMeses();
    renderHistory();
    atualizarDashboard();
}

// --- PARÂMETROS FINANCEIROS E MESES ---
function obterMesAnoAtual() {
    const agora = new Date();
    return `${nomesMeses[agora.getMonth()]}/${agora.getFullYear()}`;
}

function carregarParametros() {
    const mesAtualAutomatico = obterMesAnoAtual();
    
    // Se não houver parâmetros salvos ou se o mês salvo for antigo, sincroniza com o relógio do celular
    if (!parametros.mesAno) {
        parametros.mesAno = mesAtualAutomatico;
    }
    
    document.getElementById('param-tech').value = parametros.tecnico || "Diego Santana";
    document.getElementById('param-period').value = parametros.mesAno || mesAtualAutomatico;
    document.getElementById('param-base-pay').value = parametros.ajudaCusto !== undefined ? parametros.ajudaCusto : 300;
    document.getElementById('param-km-rate').value = parametros.taxaKm !== undefined ? parametros.taxaKm : 1.30;
    document.getElementById('param-caju').value = parametros.caju !== undefined ? parametros.caju : 250;

    // Seta o mês selecionado no histórico para o mês atual por padrão
    if (!mesSelecionadoHistorico) {
        mesSelecionadoHistorico = parametros.mesAno;
    }
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
        mesAno: document.getElementById('param-period').value || obterMesAnoAtual(),
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
    const mesAnoRegistro = `${nomesMeses[dataAtual.getMonth()]}/${dataAtual.getFullYear()}`;
    
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

        let kmRodado = 0;
        if (inputMode === 'odometro') {
            const kmPainel = parseFloat(document.getElementById('input-km').value);
            if (isNaN(kmPainel)) {
                alert('Informe o KM atual do painel.');
                return;
            }
            // Pega o último KM registrado para calcular a diferença
            const ultimoKm = obterUltimoKmPainel();
            if (ultimoKm > 0 && kmPainel < ultimoKm) {
                alert('O KM do painel não pode ser menor que o anterior.');
                return;
            }
            kmRodado = ultimoKm > 0 ? kmPainel - ultimoKm : 0;
            novoRegistro.kmPainel = kmPainel;
        } else {
            kmRodado = parseFloat(document.getElementById('input-km-trecho').value);
            if (isNaN(kmRodado) || kmRodado <= 0) {
                alert('Informe a distância correta do trecho.');
                return;
            }
        }

        novoRegistro.cliente = cliente;
        novoRegistro.os = os || '-';
        novoRegistro.kmRodado = kmRodado;

        // Limpa campos
        document.getElementById('input-client').value = '';
        document.getElementById('input-os').value = '';
        if (inputMode === 'odometro') {
            document.getElementById('input-km').value = '';
        } else {
            document.getElementById('input-km-trecho').value = '';
        }

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
    
    // Garante que ao cadastrar, exibe o mês atual do registro
    mesSelecionadoHistorico = mesAnoRegistro;
    popularSeletorMeses();
    renderHistory();
    atualizarDashboard();
}

function obterUltimoKmPainel() {
    const registrosParada = registros.filter(r => r.tipo === 'parada' && r.kmPainel);
    if (registrosParada.length === 0) return 0;
    return registrosParada[registrosParada.length - 1].kmPainel;
}

// --- GERENCIAMENTO DE MESES E HISTÓRICO ---
function popularSeletorMeses() {
    const select = document.getElementById('select-mes-referencia');
    if (!select) return;

    // Coleta todos os meses presentes nos registros + o mês atual do relógio
    const mesesSet = new Set();
    mesesSet.add(obterMesAnoAtual());
    registros.forEach(r => {
        if (r.mesAno) mesesSet.add(r.mesAno);
    });

    const mesesArray = Array.from(mesesSet);
    
    select.innerHTML = '';
    mesesArray.forEach(mes => {
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
        exibirHistoricoCompletoMes = true; // Ao trocar de mês, mostra o mês inteiro selecionado
        document.getElementById('btn-toggle-semanas').textContent = "Visualizando Mês Selecionado";
        renderHistory();
        atualizarDashboard();
    }
}

function toggleHistoricoCompleto() {
    exibirHistoricoCompletoMes = !exibirHistoricoCompletoMes;
    const btn = document.getElementById('btn-toggle-semanas');
    if (exibirHistoricoCompletoMes) {
        btn.textContent = "Mostrar Apenas Semana Atual";
        document.getElementById('label-semana-atual').textContent = `Exibindo: Mês Completo (${mesSelecionadoHistorico})`;
    } else {
        btn.textContent = "Ver Histórico Completo do Mês";
        document.getElementById('label-semana-atual').textContent = "Exibindo: Semana Atual";
    }
    renderHistory();
}

function filtrarRegistrosAtuais() {
    const mesAlvo = mesSelecionadoHistorico || obterMesAnoAtual();
    
    // Filtra pelo mês selecionado
    let filtrados = registros.filter(r => (r.mesAno || obterMesAnoAtual()) === mesAlvo);

    // Se não estiver no modo completo, filtra apenas os registros da semana atual
    if (!exibirHistoricoCompletoMes) {
        const agora = new Date();
        const inicioSemana = new Date(agora);
        inicioSemana.setDate(agora.getDate() - agora.getDay()); // Domingo da semana atual
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
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #94a3b8; padding: 20px;">Nenhum registro encontrado para este período.</td></tr>`;
        atualizarTotaisPDF(0, 0);
        return;
    }

    let totalKmPeriodo = 0;

    dadosFiltrados.forEach(reg => {
        const tr = document.createElement('tr');
        const dataFormatada = new Date(reg.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        
        let kmTexto = reg.tipo === 'abastecimento' ? `<span style="color: #34d399;">Abastecimento (R$ ${reg.valorAbastecimento.toFixed(2)})</span>` : `+${reg.kmRodado.toFixed(1)} KM`;
        if (reg.tipo === 'parada') totalKmPeriodo += reg.kmRodado;

        tr.innerHTML = `
            <td>${reg.cliente} <br><small style="color: #94a3b8;">${dataFormatada}</small></td>
            <td>${reg.os}</td>
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
    // O dashboard calcula sempre o mês selecionado completo para controle financeiro preciso
    const mesAlvo = mesSelecionadoHistorico || obterMesAnoAtual();
    const regsMes = registros.filter(r => (r.mesAno || obterMesAnoAtual()) === mesAlvo);

    let totalKm = 0;
    let totalAbastecimento = 0;
    const clientesSet = new Set();

    regsMes.forEach(r => {
        if (r.tipo === 'parada') {
            totalKm += r.kmRodado;
            if (r.cliente && !r.cliente.includes('Casa') && !r.cliente.includes('Empresa')) {
                clientesSet.add(r.cliente);
            }
        } else if (r.tipo === 'abastecimento') {
            totalAbastecimento += r.valorAbastecimento;
        }
    });

    const taxaKm = parametros.taxaKm !== undefined ? parametros.taxaKm : 1.30;
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
    const taxaKm = parametros.taxaKm !== undefined ? parametros.taxaKm : 1.30;
    const ajudaCusto = parametros.ajudaCusto !== undefined ? parametros.ajudaCusto : 300;
    const reembolsoKm = totalKm * taxaKm;
    const totalGeral = reembolsoKm + ajudaCusto;

    document.getElementById('pdf-tech-name').textContent = parametros.tecnico || "Diego Santana";
    document.getElementById('pdf-period').textContent = mesSelecionadoHistorico || obterMesAnoAtual();
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

// --- MODAL DE EXCLUSÃO DO MÊS ---
function openConfirmModal() {
    document.getElementById('modal-confirm').style.display = 'flex';
}

function closeConfirmModal() {
    document.getElementById('modal-confirm').style.display = 'none';
}

function confirmClearAll() {
    const mesAlvo = mesSelecionadoHistorico || obterMesAnoAtual();
    // Remove apenas os registros do mês selecionado, preservando os outros meses (como agosto)
    registros = registros.filter(r => (r.mesAno || obterMesAnoAtual()) !== mesAlvo);
    localStorage.setItem('controle_km_registros', JSON.stringify(registros));
    closeConfirmModal();
    renderHistory();
    atualizarDashboard();
    alert(`Registros do mês de ${mesAlvo} foram apagados com sucesso.`);
}

// --- IMPRESSÃO / PDF ---
function printPDF() {
    // Garante que o PDF imprima o mês selecionado completo
    exibirHistoricoCompletoMes = true;
    renderHistory();
    window.print();
}
