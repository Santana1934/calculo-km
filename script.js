let registros = JSON.parse(localStorage.getItem('registros_km')) || [];

// Elementos DOM
const kmForm = document.getElementById('kmForm');
const clienteInput = document.getElementById('cliente');
const protocoloOsInput = document.getElementById('protocoloOs');
const kmAtualInput = document.getElementById('kmAtual');
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

let tipoAtual = 'cliente';
let configEditavel = false;

// Carregar Configurações
nomeTecnicoInput.value = localStorage.getItem('cfg_nome') || 'Diego Santana';
periodoInput.value = localStorage.getItem('cfg_periodo') || '';
ajudaCustoInput.value = localStorage.getItem('cfg_ajuda') || '300.00';
taxaKmInput.value = localStorage.getItem('cfg_taxa') || '1.30';
cartaoCajuInput.value = localStorage.getItem('cfg_caju') || '250.00';

// Alternar Trava/Destrava das Configurações
btnToggleConfig.addEventListener('click', () => {
    configEditavel = !configEditavel;
    const inputs = [nomeTecnicoInput, periodoInput, ajudaCustoInput, taxaKmInput, cartaoCajuInput];
    
    inputs.forEach(input => {
        if (configEditavel) {
            input.removeAttribute('readonly');
            input.style.border = '1px solid var(--accent)';
        } else {
            input.setAttribute('readonly', 'true');
            input.style.border = '';
        }
    });

    if (configEditavel) {
        btnToggleConfig.textContent = '🔓 Salvar / Bloquear';
        btnToggleConfig.style.background = 'var(--accent)';
        btnToggleConfig.style.color = '#000';
    } else {
        btnToggleConfig.textContent = '🔒 Editar Parâmetros';
        btnToggleConfig.style.background = '';
        btnToggleConfig.style.color = '';
    }
});

// Salvar Configurações
[nomeTecnicoInput, periodoInput, ajudaCustoInput, taxaKmInput, cartaoCajuInput].forEach(elem => {
    elem.addEventListener('input', () => {
        localStorage.setItem('cfg_nome', nomeTecnicoInput.value);
        localStorage.setItem('cfg_periodo', periodoInput.value);
        localStorage.setItem('cfg_ajuda', ajudaCustoInput.value);
        localStorage.setItem('cfg_taxa', taxaKmInput.value);
        localStorage.setItem('cfg_caju', cartaoCajuInput.value);
        atualizarCalculos();
    });
});

function preencherAtalho(nomeLocal, tipo) {
    clienteInput.value = nomeLocal;
    tipoAtual = tipo;
    protocoloOsInput.value = '';
}

clienteInput.addEventListener('input', () => {
    const val = clienteInput.value.toLowerCase().trim();
    if (val !== 'casa' && val !== 'empresa') {
        tipoAtual = 'cliente';
    }
});

// Ações do Formulário
kmForm.addEventListener('submit', (e) => {
    e.preventDefault();
    adicionarRegistro(tipoAtual, clienteInput.value, parseFloat(kmAtualInput.value), protocoloOsInput.value);
});

document.getElementById('btnPosto').addEventListener('click', () => {
    const valorNota = prompt('Informe o valor R$ gasto no Posto:');
    if (valorNota && !isNaN(valorNota)) {
        const kmMomento = kmAtualInput.value ? parseFloat(kmAtualInput.value) : (registros.length > 0 ? registros[registros.length - 1].km : 0);
        adicionarRegistro('posto', `⛽ Abastecimento (R$ ${parseFloat(valorNota).toFixed(2)})`, kmMomento, '', parseFloat(valorNota));
    }
});

function adicionarRegistro(tipo, descricao, km, protocoloOs = '', valorGasto = 0) {
    const hoje = new Date();
    const dataStr = hoje.toLocaleDateString('pt-BR');
    const horaStr = hoje.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const novoRegistro = {
        id: Date.now(),
        data: dataStr,
        hora: horaStr,
        tipo: tipo,
        descricao: descricao,
        protocoloOs: protocoloOs,
        km: km,
        valorGasto: valorGasto
    };
    registros.push(novoRegistro);
    salvarERenderizar();
    clienteInput.value = '';
    protocoloOsInput.value = '';
    kmAtualInput.value = '';
    tipoAtual = 'cliente';
}

function deletarRegistro(id) {
    registros = registros.filter(item => item.id !== id);
    salvarERenderizar();
}

function salvarERenderizar() {
    localStorage.setItem('registros_km', JSON.stringify(registros));
    renderizarHistoricoAgrupado();
    atualizarCalculos();
}

function renderizarHistoricoAgrupado() {
    const conteiner = document.getElementById('historicoAgrupado');
    conteiner.innerHTML = '';

    if (registros.length === 0) {
        conteiner.innerHTML = '<p style="text-align:center; color:var(--sub); font-size:0.85rem; padding:15px;">Nenhum registro efetuado este mês.</p>';
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
        diaBloco.style.cssText = 'margin-bottom: 20px; background:#181818; border-radius:8px; padding:10px; border:1px solid var(--border);';

        let diaHtml = `<div style="font-weight:bold; color:var(--accent); margin-bottom:8px; font-size:0.85rem; border-bottom:1px solid var(--border); padding-bottom:4px;">📅 ${data}</div>`;
        diaHtml += `<div class="table-responsive"><table>
            <thead>
                <tr>
                    <th>Hora</th>
                    <th>Local / Protocolo</th>
                    <th>KM Painel</th>
                    <th>Trecho</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>`;

        let primeiroKmDia = null;
        let ultimoKmDia = null;

        agrupadoPorData[data].forEach(reg => {
            let trechoKm = 0;
            if (reg.tipo !== 'posto') {
                if (kmAnteriorGeral !== null) {
                    trechoKm = reg.km - kmAnteriorGeral;
                    if (trechoKm < 0) trechoKm = 0;
                }
                kmAnteriorGeral = reg.km;
                if (primeiroKmDia === null) primeiroKmDia = reg.km;
                ultimoKmDia = reg.km;
            }

            const badgeTipo = reg.tipo === 'cliente' ? '👤' : (reg.tipo === 'base' ? '🏢' : '⛽');
            const osTexto = reg.protocoloOs ? ` <span style="font-size:0.75rem; color:var(--sub);">[Prot: ${reg.protocoloOs}]</span>` : '';
            const classeLinha = reg.tipo === 'posto' ? 'class="row-posto"' : '';

            diaHtml += `
                <tr ${classeLinha}>
                    <td>${reg.hora || ''}</td>
                    <td>${badgeTipo} ${reg.descricao}${osTexto}</td>
                    <td>${reg.km ? reg.km + ' KM' : '-'}</td>
                    <td>${reg.tipo !== 'posto' ? '+' + trechoKm + ' KM' : '-'}</td>
                    <td><button class="btn-del" onclick="deletarRegistro(${reg.id})">❌</button></td>
                </tr>
            `;
        });

        let totalDiaKm = (primeiroKmDia !== null && ultimoKmDia !== null) ? (ultimoKmDia - primeiroKmDia) : 0;

        diaHtml += `</tbody></table></div>`;
        diaHtml += `<div style="text-align:right; font-size:0.8rem; font-weight:bold; color:#fff; margin-top:6px; background:#262626; padding:6px 10px; border-radius:4px;">
            Total Rodado no Dia: <span style="color:var(--accent);">${totalDiaKm} KM</span>
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
        if (reg.tipo === 'cliente') {
            contadorClientes++;
        }
        
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

    totalKmEl.textContent = `${kmTotalRodado} KM`;
    totalClientesEl.textContent = `${contadorClientes}`;
    totalKmValorEl.textContent = `R$ ${kmValorTotal.toFixed(2)}`;
    totalEmpresaEl.textContent = `R$ ${totalEmpresaPaga.toFixed(2)}`;
    totalGastosPostoEl.textContent = `R$ ${totalGastosPosto.toFixed(2)}`;
    saldoCajuEl.textContent = `R$ ${saldoCajuRestante.toFixed(2)}`;
    custoPorKmEl.textContent = `R$ ${custoPorKm.toFixed(2)}/KM`;
    sobraLiquidaEl.textContent = `R$ ${sobraLiquida.toFixed(2)}`;
}

document.getElementById('btnPdf').addEventListener('click', () => window.print());
document.getElementById('btnLimpar').addEventListener('click', () => {
    if (confirm('Deseja apagar todos os registros do mês atual?')) {
        registros = [];
        salvarERenderizar();
    }
});

salvarERenderizar();
