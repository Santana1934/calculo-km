let registros = JSON.parse(localStorage.getItem('registros_km')) || [];
let modoAtual = 'parada';
let tipoAtalho = 'cliente';
let configEditavel = false;

// Elementos DOM
const kmForm = document.getElementById('kmForm');
const clienteInput = document.getElementById('cliente');
const protocoloOsInput = document.getElementById('protocoloOs');
const kmAtualInput = document.getElementById('kmAtual');
const valorPostoInput = document.getElementById('valorPostoInput');

const secaoParada = document.getElementById('secaoParada');
const secaoPosto = document.getElementById('secaoPosto');
const tabParada = document.getElementById('tabParada');
const tabPosto = document.getElementById('tabPosto');
const btnSalvar = document.getElementById('btnSalvar');
const labelKm = document.getElementById('labelKm');

const nomeTecnicoInput = document.getElementById('nomeTecnico');
const periodoInput = document.getElementById('periodoRelatorio');
const ajudaCustoInput = document.getElementById('ajudaCusto');
const taxaKmInput = document.getElementById('taxaKm');
const cartaoCajuInput = document.getElementById('cartaoCaju');
const btnToggleConfig = document.getElementById('btnToggleConfig');

const totalKmEl = document.getElementById('totalKm');
const totalClientesEl = document.getElementById('totalClientes');
const totalKmValorEl = document.getElementById('totalKmValor');
const totalEmpresaEl = document.getElementById('totalEmpresa');
const totalGastosPostoEl = document.getElementById('totalGastosPosto');
const saldoCajuEl = document.getElementById('saldoCaju');
const custoPorKmEl = document.getElementById('custoPorKm');
const sobraLiquidaEl = document.getElementById('sobraLiquida');

function carregarConfiguracoes() {
    const nomeSalvo = localStorage.getItem('cfg_nome');
    const periodoSalvo = localStorage.getItem('cfg_periodo');
    const ajudaSalva = localStorage.getItem('cfg_ajuda');
    const taxaSalva = localStorage.getItem('cfg_taxa');
    const cajuSalvo = localStorage.getItem('cfg_caju');

    nomeTecnicoInput.value = (nomeSalvo && nomeSalvo.trim() !== '') ? nomeSalvo : 'Diego Santana';
    periodoInput.value = (periodoSalvo !== null) ? periodoSalvo : '';
    ajudaCustoInput.value = (ajudaSalva && !isNaN(ajudaSalva) && parseFloat(ajudaSalva) > 0) ? ajudaSalva : '300.00';
    taxaKmInput.value = (taxaSalva && !isNaN(taxaSalva) && parseFloat(taxaSalva) > 0) ? taxaSalva : '1.30';
    cartaoCajuInput.value = (cajuSalvo && !isNaN(cajuSalvo) && parseFloat(cajuSalvo) >= 0) ? cajuSalvo : '250.00';

    localStorage.setItem('cfg_ajuda', ajudaCustoInput.value);
    localStorage.setItem('cfg_taxa', taxaKmInput.value);
    localStorage.setItem('cfg_caju', cartaoCajuInput.value);
}

window.alternarModo = function(modo) {
    modoAtual = modo;
    if (modo === 'parada') {
        tabParada.classList.add('active');
        tabPosto.classList.remove('active');
        secaoParada.style.display = 'block';
        secaoPosto.style.display = 'none';
        labelKm.textContent = 'KM ATUAL DO PAINEL';
        btnSalvar.textContent = 'Salvar Parada';
    } else {
        tabPosto.classList.add('active');
        tabParada.classList.remove('active');
        secaoParada.style.display = 'none';
        secaoPosto.style.display = 'block';
        labelKm.textContent = 'KM ATUAL DO PAINEL (OPCIONAL)';
        btnSalvar.textContent = 'Confirmar Abastecimento';
    }
};

window.preencherAtalho = function(nomeLocal, tipo) {
    clienteInput.value = nomeLocal;
    tipoAtalho = tipo;
    protocoloOsInput.value = '';
};

window.deletarRegistro = function(id) {
    registros = registros.filter(item => item.id !== id);
    salvarERenderizar();
};

/* --- EDIÇÃO DE REGISTROS --- */
window.abrirModalEdicao = function(id) {
    const reg = registros.find(item => item.id === id);
    if (!reg) return;

    document.getElementById('editId').value = reg.id;
    document.getElementById('editDescricao').value = reg.descricao;

    if (reg.tipo === 'posto') {
        document.getElementById('groupEditKm').style.display = 'none';
        document.getElementById('groupEditOs').style.display = 'none';
        document.getElementById('groupEditValor').style.display = 'block';
        document.getElementById('editValor').value = reg.valorGasto;
    } else {
        document.getElementById('groupEditKm').style.display = 'block';
        document.getElementById('groupEditOs').style.display = 'block';
        document.getElementById('groupEditValor').style.display = 'none';
        document.getElementById('editKm').value = reg.km;
        document.getElementById('editOs').value = reg.protocoloOs || '';
    }

    document.getElementById('modalEdit').style.display = 'flex';
};

window.fecharModal = function() {
    document.getElementById('modalEdit').style.display = 'none';
};

window.salvarEdicao = function() {
    const id = parseInt(document.getElementById('editId').value);
    const index = registros.findIndex(item => item.id === id);

    if (index !== -1) {
        registros[index].descricao = document.getElementById('editDescricao').value.trim();
        
        if (registros[index].tipo === 'posto') {
            registros[index].valorGasto = parseFloat(document.getElementById('editValor').value) || 0;
        } else {
            registros[index].km = parseFloat(document.getElementById('editKm').value) || 0;
            registros[index].protocoloOs = document.getElementById('editOs').value.trim();
        }

        salvarERenderizar();
    }
    window.fecharModal();
};

/* --- MODAL CONFIRMAR LIMPEZA --- */
window.abrirModalConfirm = function() {
    document.getElementById('modalConfirm').style.display = 'flex';
};

window.fecharModalConfirm = function() {
    document.getElementById('modalConfirm').style.display = 'none';
};

window.confirmarLimpezaGeral = function() {
    registros = [];
    salvarERenderizar();
    window.fecharModalConfirm();
};

btnToggleConfig.addEventListener('click', () => {
    configEditavel = !configEditavel;
    const campos = document.querySelectorAll('.campo-parametro');
    
    campos.forEach(campo => {
        if (configEditavel) {
            campo.removeAttribute('readonly');
            campo.style.borderColor = 'var(--primary)';
        } else {
            campo.setAttribute('readonly', 'readonly');
            campo.style.borderColor = '';
        }
    });

    if (configEditavel) {
        btnToggleConfig.textContent = '🔓 Salvar Parâmetros';
        nomeTecnicoInput.focus();
    } else {
        localStorage.setItem('cfg_nome', nomeTecnicoInput.value);
        localStorage.setItem('cfg_periodo', periodoInput.value);
        localStorage.setItem('cfg_ajuda', ajudaCustoInput.value || '300.00');
        localStorage.setItem('cfg_taxa', taxaKmInput.value || '1.30');
        localStorage.setItem('cfg_caju', cartaoCajuInput.value || '250.00');
        btnToggleConfig.textContent = '🔒 Editar Parâmetros';
        atualizarCalculos();
    }
});

kmForm.addEventListener('submit', (e) => {
    e.preventDefault();

    if (modoAtual === 'parada') {
        const kmVal = parseFloat(kmAtualInput.value);
        if (isNaN(kmVal)) return;

        let tipoFinal = tipoAtalho;
        const localTexto = clienteInput.value.trim();
        if (localTexto.toLowerCase() !== 'casa' && localTexto.toLowerCase() !== 'empresa') {
            tipoFinal = 'cliente';
        }

        adicionarRegistro(tipoFinal, localTexto || 'Parada', kmVal, protocoloOsInput.value, 0);
    } else {
        const valorGasto = parseFloat(valorPostoInput.value);
        if (isNaN(valorGasto) || valorGasto <= 0) return;

        let kmVal = parseFloat(kmAtualInput.value);
        if (isNaN(kmVal)) {
            kmVal = registros.length > 0 ? registros[registros.length - 1].km : 0;
        }

        adicionarRegistro('posto', 'Abastecimento', kmVal, '', valorGasto);
        valorPostoInput.value = '';
    }

    clienteInput.value = '';
    protocoloOsInput.value = '';
    kmAtualInput.value = '';
    tipoAtalho = 'cliente';
    window.alternarModo('parada');
});

function adicionarRegistro(tipo, descricao, km, protocoloOs = '', valorGasto = 0) {
    const hoje = new Date();
    const dataStr = hoje.toLocaleDateString('pt-BR');

    registros.push({
        id: Date.now(),
        data: dataStr,
        tipo: tipo,
        descricao: descricao,
        protocoloOs: protocoloOs,
        km: km,
        valorGasto: valorGasto
    });

    salvarERenderizar();
}

function salvarERenderizar() {
    localStorage.setItem('registros_km', JSON.stringify(registros));
    renderizarHistorico();
    atualizarCalculos();
}

function renderizarHistorico() {
    const conteiner = document.getElementById('historicoAgrupado');
    conteiner.innerHTML = '';

    if (registros.length === 0) {
        conteiner.innerHTML = '<p style="text-align:center; color:var(--text-sub); font-size:0.85rem; padding:15px;">Nenhum registro efetuado este mês.</p>';
        return;
    }

    const agrupadoPorData = {};
    registros.forEach(reg => {
        if (!agrupadoPorData[reg.data]) agrupadoPorData[reg.data] = [];
        agrupadoPorData[reg.data].push(reg);
    });

    let kmAnteriorGeral = null;

    Object.keys(agrupadoPorData).forEach(data => {
        const diaBloco = document.createElement('div');
        diaBloco.className = 'dia-bloco-print';
        diaBloco.style.cssText = 'margin-bottom: 12px; background:var(--input-bg); border-radius:8px; padding:10px; border:1px solid var(--card-border);';

        let diaHtml = `<div class="dia-header-print" style="font-weight:600; color:var(--primary); margin-bottom:6px; font-size:0.8rem; border-bottom:1px solid var(--card-border); padding-bottom:4px;">Data: ${data}</div>`;
        diaHtml += `<div class="table-responsive"><table>
            <thead>
                <tr>
                    <th>Cliente / Local</th>
                    <th>Protocolo / OS</th>
                    <th style="text-align:right;">KM Rodado</th>
                    <th class="col-acoes no-print" style="text-align:right;">Ação</th>
                </tr>
            </thead>
            <tbody>`;

        let totalKmDia = 0;

        agrupadoPorData[data].forEach(reg => {
            let trechoKm = 0;
            if (reg.tipo !== 'posto') {
                if (kmAnteriorGeral !== null) {
                    trechoKm = Math.max(0, reg.km - kmAnteriorGeral);
                }
                kmAnteriorGeral = reg.km;
                totalKmDia += trechoKm;
            }

            let detalheHtml = '';
            let osTexto = reg.protocoloOs || '-';

            if (reg.tipo === 'posto') {
                detalheHtml = `<span class="badge-posto-amber" onclick="abrirModalEdicao(${reg.id})" title="Clique para editar">⛽ Abastecimento (R$ ${reg.valorGasto.toFixed(2)})</span>`;
                osTexto = '-';
            } else {
                detalheHtml = `<span onclick="abrirModalEdicao(${reg.id})" style="cursor:pointer;" title="Clique para editar">${reg.descricao}</span>`;
            }

            diaHtml += `
                <tr>
                    <td>${detalheHtml}</td>
                    <td>${osTexto}</td>
                    <td style="text-align:right;">${reg.tipo !== 'posto' ? '+' + trechoKm + ' KM' : '-'}</td>
                    <td class="col-acoes no-print" style="text-align:right;">
                        <button class="btn-icon-subtle delete" onclick="deletarRegistro(${reg.id})" title="Excluir">×</button>
                    </td>
                </tr>
            `;
        });

        diaHtml += `</tbody></table></div>`;
        diaHtml += `<div style="text-align:right; font-size:0.75rem; color:var(--text-sub); margin-top:6px;" class="no-print">
            Total Rodado no Dia: <strong style="color:var(--primary);">${totalKmDia} KM</strong>
        </div>`;

        diaBloco.innerHTML = diaHtml;
        conteiner.appendChild(diaBloco);
    });
}

function atualizarCalculos() {
    let kmTotalRodado = 0;
    let primeiroKm = null;
    let ultimoKm = null;
    let totalGastosPosto = 0;
    let contadorClientes = 0;

    registros.forEach((reg) => {
        if (reg.tipo === 'cliente') contadorClientes++;
        
        if (reg.tipo !== 'posto') {
            if (primeiroKm === null) primeiroKm = reg.km;
            ultimoKm = reg.km;
        } else if (reg.tipo === 'posto') {
            totalGastosPosto += reg.valorGasto;
        }
    });

    if (primeiroKm !== null && ultimoKm !== null && ultimoKm >= primeiroKm) {
        kmTotalRodado = ultimoKm - primeiroKm;
    }

    const ajudaCusto = parseFloat(ajudaCustoInput.value) || 0;
    const taxa = parseFloat(taxaKmInput.value) || 0;
    const cajuInicial = parseFloat(cartaoCajuInput.value) || 0;

    const kmValorTotal = kmTotalRodado * taxa;
    const totalEmpresaPaga = ajudaCusto + kmValorTotal;
    const sobraLiquida = totalEmpresaPaga - totalGastosPosto;
    const saldoCajuRestante = Math.max(0, cajuInicial - totalGastosPosto);
    const custoPorKm = kmTotalRodado > 0 ? (totalGastosPosto / kmTotalRodado) : 0;

    // Atualiza Tela
    totalKmEl.textContent = `${kmTotalRodado} KM`;
    totalClientesEl.textContent = `${contadorClientes}`;
    totalKmValorEl.textContent = `R$ ${kmValorTotal.toFixed(2)}`;
    totalEmpresaEl.textContent = `R$ ${totalEmpresaPaga.toFixed(2)}`;
    totalGastosPostoEl.textContent = `R$ ${totalGastosPosto.toFixed(2)}`;
    saldoCajuEl.textContent = `R$ ${saldoCajuRestante.toFixed(2)}`;
    custoPorKmEl.textContent = `R$ ${custoPorKm.toFixed(2)}/KM`;
    sobraLiquidaEl.textContent = `R$ ${sobraLiquida.toFixed(2)}`;

    // Metadados do PDF (Cabeçalho)
    const tecNome = nomeTecnicoInput.value || 'Não informado';
    const mesAno = periodoInput.value || 'Não informado';

    document.getElementById('printMetaInfo').innerHTML = `<strong>TÉCNICO:</strong> ${tecNome} &nbsp;|&nbsp; <strong>PERÍODO:</strong> ${mesAno}`;
    
    document.getElementById('printParamsSummary').innerHTML = `
        <strong>Ajuda de Custo Fixa:</strong> R$ ${ajudaCusto.toFixed(2)} &nbsp;|&nbsp; 
        <strong>Valor por KM (Empresa):</strong> R$ ${taxa.toFixed(2)} &nbsp;|&nbsp; 
        <strong>Cartão Caju (Combustível Solicitado):</strong> R$ ${cajuInicial.toFixed(2)}
    `;

    // Fechamento Financeiro no PDF
    document.getElementById('printFinalCalc').innerHTML = `
        <div><strong>TOTAL DE KM RODADOS:</strong> ${kmTotalRodado} KM</div>
        <div><strong>CÁLCULO KM:</strong> ${kmTotalRodado} KM × R$ ${taxa.toFixed(2)} = <strong>R$ ${kmValorTotal.toFixed(2)}</strong></div>
        <div><strong>AJUDA DE CUSTO FIXA:</strong> R$ ${ajudaCusto.toFixed(2)}</div>
        <div style="font-size:0.95rem; font-weight:bold; margin-top:4px; border-top:1px solid #000; padding-top:4px;">
            VALOR TOTAL DE REEMBOLSO: R$ ${(kmValorTotal + ajudaCusto).toFixed(2)}
        </div>
    `;
}

document.getElementById('btnPdf').addEventListener('click', () => window.print());
document.getElementById('btnLimpar').addEventListener('click', abrirModalConfirm);

carregarConfiguracoes();
salvarERenderizar();
