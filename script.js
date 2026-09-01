// --- CONTROLE DE ACESSO E SEGURANÇA ---
const CHAVE_MESTRE = "102030"; // Chave de liberação do app

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
let mesSelecionadoHistorico = ""; 
let exibirHistoricoCompletoMes = false; 

// Meses do ano para formatação automática baseada no relógio do dispositivo
const nomesMeses = [
    "JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO", 
    "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"
];

function obterMesAnoAtual() {
    const agora = new Date();
    return `${nomesMeses[agora.getMonth()]}/${agora.getFullYear()}`;
}

function inicializarApp() {
    // Migração de segurança: se houver registros antigos sem propriedade mesAno, atribui AGOSTO/2026 para protegê-los
    let alterou = false;
    registros.forEach(r => {
        if (!r.mesAno) {
            r.mesAno = "AGOSTO/2026";
            alterou = true;
        }
    });
    if (alterou) {
        localStorage.setItem('controle_km_registros', JSON.stringify(registros));
    }

    carregarParametros();
    popularSeletorMeses();
    renderHistory();
    atualizarDashboard();
}

// --- PARÂMETROS FINANCEIROS E MESES ---
function carregarParametros() {
    const mesAtualAutomatico = obterMesAnoAtual();
    
    // Força a sincronização do mês atual com o relógio do celular se estiver vazio ou travado em mês antigo
    if (!parametros.mesAno || parametros.mesAno.includes("Agosto") || parametros.mesAno === "AGOSTO/2026") {
        parametros.mesAno = mesAtualAutomatico;
    }
    
    document.getElementById('param-tech').value = parametros.tecnico || "Diego Santana";
    document.getElementById('param-period').value = parametros.mesAno || mesAtualAutomatico;
    document.getElementById('param-base-pay').value = parametros.ajudaCusto !== undefined ? parametros.ajudaCusto : 300;
    document.getElementById('param-km-rate').value = parametros.taxaKm !== undefined ? parametros.taxaKm : 1.30;
    document.getElementById('param-caju').value = parametros.caju !== undefined ? parametros.caju : 250;

    // Garante que o histórico inicialize focado no mês atual do relógio
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

        let kmRodado = 0;
        if (inputMode === 'odometro') {
            const kmPainel = parseFloat(document.getElementById('input-km').value);
            if (isNaN(kmPainel)) {
                alert('Informe o KM atual do painel.');
                return;
            }
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

    const mesesSet = new Set();
    mesesSet.add(obterMesAnoAtual());
    mesesSet.add("AGOSTO/2026"); // Garante AGOSTO fixo na lista para você acessar seus dados salvos
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
        exibirHistoricoCompletoMes = true; 
        document.getElementById('btn-toggle-semanas').textContent = "Visualizando Mês Selecionado";
        document.getElementById('label-semana-atual').textContent = `Exibindo: Mês Completo (${mesSelecionadoHistorico})`;
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
    
    let filtrados = registros.filter(r => (r.mesAno || "AGOSTO/2026") === mesAlvo);

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
    const mesAlvo = mesSelecionadoHistorico || obterMesAnoAtual();
    const regsMes = registros.filter(r => (r.mesAno || "AGOSTO/2026") === mesAlvo);

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

// --- MODAL DE EXCLUSÃO DO MÊS COM DUPLO AVISO E BACKUP DE SEGURANÇA ---
function openConfirmModal() {
    document.getElementById('modal-confirm').style.display = 'flex';
}

function closeConfirmModal() {
    document.getElementById('modal-confirm').style.display = 'none';
}

function confirmClearAll() {
    closeConfirmModal();
    
    // Duplo aviso de segurança rigoroso contra exclusão acidental
    let aviso1 = confirm("⚠️ ATENÇÃO: Você solicitou apagar todos os registros do mês de " + (mesSelecionadoHistorico || obterMesAnoAtual()) + ". Tem certeza absoluta?");
    if (!aviso1) return;

    let aviso2 = prompt("Para confirmar e proteger seus dados contra erros, digite a palavra APAGAR abaixo:");
    if (aviso2 !== "APAGAR") {
        alert("Operação cancelada com segurança. Seus dados continuam intactos!");
        return;
    }

    const mesAlvo = mesSelecionadoHistorico || obterMesAnoAtual();
    
    // Cria um backup completo na lixeira antes de remover do app
    localStorage.setItem('controle_km_backup_lixeira', JSON.stringify(registros));

    // Remove apenas os registros do mês selecionado
    registros = registros.filter(r => (r.mesAno || "AGOSTO/2026") !== mesAlvo);
    localStorage.setItem('controle_km_registros', JSON.stringify(registros));
    
    renderHistory();
    atualizarDashboard();
    alert(`📁 Registros do mês de ${mesAlvo} apagados. Um backup de segurança foi armazenado no navegador caso precise restaurar.`);
}

// --- IMPRESSÃO / PDF ---
function printPDF() {
    exibirHistoricoCompletoMes = true;
    renderHistory();
    window.print();
}
