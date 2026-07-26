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

// GARANTE VALORES PADRÃO ROBUSTOS (FORÇA 300 SE ESTIVER VAZIO OU INVÁLIDO)
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

    // Salva os padrões validados caso estivessem em branco no storage
    localStorage.setItem('cfg_ajuda', ajudaCustoInput.value);
    localStorage.setItem('cfg_taxa', taxaKmInput.value);
    localStorage.setItem('cfg_caju', cartaoCajuInput.value);
}

// ALTERNÂNCIA DE MODO EXPOSTA GLOBALMENTE
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

[nomeTecnicoInput, periodoInput, ajudaCustoInput, taxaKmInput, cartaoCajuInput].forEach(elem => {
    elem.addEventListener('input', () => {
        if (configEditavel) {
            localStorage.setItem('cfg_nome', nomeTecnicoInput.value);
            localStorage.setItem('cfg_periodo', periodoInput.value);
            localStorage.setItem('cfg_ajuda', ajudaCustoInput.value);
            localStorage.setItem('cfg_taxa', taxaKmInput.value);
            localStorage.setItem('cfg_caju', cartaoCajuInput.value);
            atualizarCalculos();
        }
    });
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
        if (isNaN(valorGasto) || valorGasto <= 0) {
            alert('Por favor, informe um valor válido para o abastecimento.');
            return;
        }

        let kmVal = parseFloat(kmAtualInput.value);
        if (isNaN(kmVal)) {
            // Se não preencheu o KM no posto, pega o último KM registrado ou 0
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
    const horaStr = hoje.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    registros.push({
        id: Date.now(),
        data: dataStr,
        hora: horaStr,
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
        diaBloco.style.cssText = 'margin-bottom: 16px; background:var(--input-bg); border-radius:8px; padding:10px; border:1px solid var(--card-border);';

        let diaHtml = `<div style="font-weight:600; color:var(--primary); margin-bottom:8px; font-size:0.8rem; border-bottom:1px solid var(--card-border); padding-bottom:4px;">📅 ${data}</div>`;
        diaHtml += `<div class="table-responsive"><table>
            <thead>
                <tr>
                    <th>Hora</th>
                    <th>Local / Detalhe</th>
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
                    trechoKm = Math.max(0, reg.km - kmAnteriorGeral);
                }
                kmAnteriorGeral = reg.km;
                if (primeiroKmDia === null) primeiroKmDia = reg.km;
                ultimoKmDia = reg.km;
            }

            let detalheHtml = '';
            if (reg.tipo === 'posto') {
                detalheHtml = `<span class="badge-posto">⛽ Abastecimento (R$ ${reg.valorGasto.toFixed(2)})</span>`;
            } else {
                const osTexto = reg.protocoloOs ? `<br><span style="font-size:0.7rem; color:var(--text-sub);">[Prot: ${reg.protocoloOs}]</span>` : '';
                detalheHtml = `${reg.descricao}${osTexto}`;
            }

            diaHtml += `
                <tr>
                    <td>${reg.hora || ''}</td>
                    <td>${detalheHtml}</td>
                    <td>${reg.km ? reg.km + ' KM' : '-'}</td>
                    <td>${reg.tipo !== 'posto' ? '+' + trechoKm + ' KM' : '-'}</td>
                    <td><button class="btn-del" onclick="deletarRegistro(${reg.id})">❌</button></td>
                </tr>
            `;
        });

        const totalDiaKm = (primeiroKmDia !== null && ultimoKmDia !== null) ? (ultimoKmDia - primeiroKmDia) : 0;

        diaHtml += `</tbody></table></div>`;
        diaHtml += `<div style="text-align:right; font-size:0.75rem; color:var(--text-sub); margin-top:6px;">
            Total Rodado no Dia: <strong style="color:var(--primary);">${totalDiaKm} KM</strong>
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

    const ajudaCusto = parseFloat(ajudaCustoInput.value) || 300;
    const taxa = parseFloat(taxaKmInput.value) || 1.30;
    const cajuInicial = parseFloat(cartaoCajuInput.value) || 250;

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

    if (sobraLiquida < 0) {
        sobraLiquidaEl.style.color = 'var(--danger)';
    } else {
        sobraLiquidaEl.style.color = 'var(--primary)';
    }
}

document.getElementById('btnPdf').addEventListener('click', () => window.print());
document.getElementById('btnLimpar').addEventListener('click', () => {
    if (confirm('Deseja apagar todos os registros do mês atual?')) {
        registros = [];
        salvarERenderizar();
    }
});

carregarConfiguracoes();
salvarERenderizar();
