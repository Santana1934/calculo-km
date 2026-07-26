let registros = JSON.parse(localStorage.getItem('registros_km')) || [];

// Elementos DOM
const kmForm = document.getElementById('kmForm');
const clienteInput = document.getElementById('cliente');
const kmAtualInput = document.getElementById('kmAtual');
const nomeTecnicoInput = document.getElementById('nomeTecnico');
const periodoInput = document.getElementById('periodoRelatorio');
const taxaKmInput = document.getElementById('taxaKm');
const cartaoCajuInput = document.getElementById('cartaoCaju');

const totalKmEl = document.getElementById('totalKm');
const totalKmValorEl = document.getElementById('totalKmValor');
const totalEmpresaEl = document.getElementById('totalEmpresa');
const totalGastosPostoEl = document.getElementById('totalGastosPosto');
const exibeCajuEl = document.getElementById('exibeCaju');
const sobraLiquidaEl = document.getElementById('sobraLiquida');

// Carregar Configurações
nomeTecnicoInput.value = localStorage.getItem('cfg_nome') || '';
periodoInput.value = localStorage.getItem('cfg_periodo') || '';
taxaKmInput.value = localStorage.getItem('cfg_taxa') || '1.30';
cartaoCajuInput.value = localStorage.getItem('cfg_caju') || '250.00';

// Salvar Configurações Automaticamente
[nomeTecnicoInput, periodoInput, taxaKmInput, cartaoCajuInput].forEach(elem => {
    elem.addEventListener('input', () => {
        localStorage.setItem('cfg_nome', nomeTecnicoInput.value);
        localStorage.setItem('cfg_periodo', periodoInput.value);
        localStorage.setItem('cfg_taxa', taxaKmInput.value);
        localStorage.setItem('cfg_caju', cartaoCajuInput.value);
        atualizarCalculos();
    });
});

// Ações do Formulário
kmForm.addEventListener('submit', (e) => {
    e.preventDefault();
    adicionarRegistro('trajeto', clienteInput.value, parseFloat(kmAtualInput.value));
});

document.getElementById('btnPosto').addEventListener('click', () => {
    const valorNota = prompt('Informe o valor R$ gasto no Posto:');
    if (valorNota && !isNaN(valorNota)) {
        const kmMomento = kmAtualInput.value ? parseFloat(kmAtualInput.value) : (registros.length > 0 ? registros[registros.length - 1].km : 0);
        adicionarRegistro('posto', `⛽ Abastecimento (R$ ${parseFloat(valorNota).toFixed(2)})`, kmMomento, parseFloat(valorNota));
    }
});

function adicionarRegistro(tipo, descricao, km, valorGasto = 0) {
    const novoRegistro = {
        id: Date.now(),
        data: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
        tipo: tipo,
        descricao: descricao,
        km: km,
        valorGasto: valorGasto
    };
    registros.push(novoRegistro);
    salvarERenderizar();
    clienteInput.value = '';
    kmAtualInput.value = '';
}

function deletarRegistro(id) {
    registros = registros.filter(item => item.id !== id);
    salvarERenderizar();
}

function salvarERenderizar() {
    localStorage.setItem('registros_km', JSON.stringify(registros));
    renderizarTabela();
    atualizarCalculos();
}

function renderizarTabela() {
    const tbody = document.getElementById('listaRegistros');
    tbody.innerHTML = '';
    let kmAnterior = null;

    registros.forEach((reg) => {
        const tr = document.createElement('tr');
        if (reg.tipo === 'posto') tr.classList.add('row-posto');

        let trechoKm = 0;
        if (reg.tipo === 'trajeto' && kmAnterior !== null) {
            trechoKm = reg.km - kmAnterior;
            if (trechoKm < 0) trechoKm = 0;
        }
        if (reg.tipo === 'trajeto') kmAnterior = reg.km;

        tr.innerHTML = `
            <td>${reg.data}</td>
            <td>${reg.descricao}</td>
            <td>${reg.km ? reg.km + ' KM' : '-'}</td>
            <td>${reg.tipo === 'trajeto' ? '+' + trechoKm + ' KM' : '-'}</td>
            <td><button class="btn-del" onclick="deletarRegistro(${reg.id})">❌</button></td>
        `;
        tbody.appendChild(tr);
    });
}

function atualizarCalculos() {
    let kmTotalRodado = 0;
    let primeiroKm = null;
    let ultimoKm = null;
    let totalGastosPosto = 0;

    registros.forEach((reg) => {
        if (reg.tipo === 'trajeto') {
            if (primeiroKm === null) primeiroKm = reg.km;
            ultimoKm = reg.km;
        } else if (reg.tipo === 'posto') {
            totalGastosPosto += reg.valorGasto;
        }
    });

    if (primeiroKm !== null && ultimoKm !== null && ultimoKm >= primeiroKm) {
        kmTotalRodado = ultimoKm - primeiroKm;
    }

    const taxa = parseFloat(taxaKmInput.value) || 0;
    const caju = parseFloat(cartaoCajuInput.value) || 0;
    const ajudaCustoFixa = 300.00;

    const kmValorTotal = kmTotalRodado * taxa;
    const totalEmpresaPaga = ajudaCustoFixa + kmValorTotal + caju;
    const sobraLiquida = (ajudaCustoFixa + kmValorTotal) - (totalGastosPosto - caju);

    totalKmEl.textContent = `${kmTotalRodado} KM`;
    totalKmValorEl.textContent = `R$ ${kmValorTotal.toFixed(2)}`;
    totalEmpresaEl.textContent = `R$ ${totalEmpresaPaga.toFixed(2)}`;
    totalGastosPostoEl.textContent = `R$ ${totalGastosPosto.toFixed(2)}`;
    exibeCajuEl.textContent = `R$ ${caju.toFixed(2)}`;
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
