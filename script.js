let mode = 'parada';
let paramsUnlocked = false;
let entries = JSON.parse(localStorage.getItem('km_entries_v2')) || [];
let lastKmInput = parseFloat(localStorage.getItem('last_km_input')) || 0;

let params = JSON.parse(localStorage.getItem('km_params')) || {
    tech: 'DIEGO SANTANA',
    period: 'JULHO/2026',
    basePay: 300,
    kmRate: 1.30,
    caju: 250
};

function initParamsUI() {
    document.getElementById('param-tech').value = params.tech;
    document.getElementById('param-period').value = params.period;
    document.getElementById('param-base-pay').value = params.basePay;
    document.getElementById('param-km-rate').value = params.kmRate;
    document.getElementById('param-caju').value = params.caju;

    document.getElementById('pdf-tech-name').innerText = params.tech;
    document.getElementById('pdf-period').innerText = params.period;
    document.getElementById('pdf-base-pay').innerText = parseFloat(params.basePay).toFixed(2);
    document.getElementById('pdf-km-rate').innerText = parseFloat(params.kmRate).toFixed(2);
    document.getElementById('pdf-caju-budget').innerText = parseFloat(params.caju).toFixed(2);
    document.getElementById('pdf-summary-base').innerText = parseFloat(params.basePay).toFixed(2);
}

function toggleEditParams() {
    paramsUnlocked = !paramsUnlocked;
    const inputs = ['param-tech', 'param-period', 'param-base-pay', 'param-km-rate', 'param-caju'];
    const btn = document.getElementById('btn-edit-params');

    inputs.forEach(id => {
        document.getElementById(id).disabled = !paramsUnlocked;
    });

    if (paramsUnlocked) {
        btn.innerText = '🔓 Salvar Parâmetros';
        btn.style.background = '#10b981';
        btn.style.color = '#fff';
    } else {
        params.tech = document.getElementById('param-tech').value || 'DIEGO SANTANA';
        params.period = document.getElementById('param-period').value || 'JULHO/2026';
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

function addEntry() {
    if (mode === 'parada') {
        const client = document.getElementById('input-client').value;
        const os = document.getElementById('input-os').value;
        const inputKmVal = parseFloat(document.getElementById('input-km').value) || 0;

        if (!client) {
            alert('Informe o cliente/local.');
            return;
        }

        let kmCalculado = inputKmVal;

        // Lógica de cálculo acumulativo de KM do painel
        if (inputKmVal > 0) {
            if (lastKmInput > 0 && inputKmVal > lastKmInput) {
                kmCalculado = inputKmVal - lastKmInput;
            }
            lastKmInput = inputKmVal;
            localStorage.setItem('last_km_input', lastKmInput);
        }

        entries.push({
            id: Date.now(),
            type: 'parada',
            client,
            os: os || '-',
            km: kmCalculado
        });
    } else {
        const fuel = parseFloat(document.getElementById('input-fuel').value) || 0;
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

function deleteEntry(id) {
    if (confirm('Deseja apagar este registro?')) {
        entries = entries.filter(e => e.id !== id);
        saveAndRender();
    }
}

function clearAll() {
    if (confirm('Tem certeza que deseja apagar todos os registros do mês?')) {
        entries = [];
        lastKmInput = 0;
        localStorage.removeItem('last_km_input');
        saveAndRender();
    }
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
                <td>${item.client}</td>
                <td>${item.os}</td>
                <td>+${item.km} KM</td>
                <td class="no-print"><button class="btn-icon-subtle" onclick="deleteEntry(${item.id})">×</button></td>
            `;
        }
        tbody.appendChild(tr);
    });
}

function calculateTotals() {
    let totalKm = 0;
    let totalFuel = 0;
    let clientCount = 0;

    entries.forEach(item => {
        if (item.type === 'parada') {
            totalKm += item.km;
            clientCount++;
        }
        if (item.type === 'abastecimento') {
            totalFuel += item.valor;
        }
    });

    const kmReimbursement = totalKm * params.kmRate;
    const netProfit = params.basePay + kmReimbursement;
    const cajuRemaining = params.caju - totalFuel;
    let costPerKm = totalKm > 0 ? (totalFuel / totalKm) : 0;

    document.getElementById('dash-total-km').innerText = `${totalKm} KM`;
    document.getElementById('dash-total-clients').innerText = clientCount;
    document.getElementById('dash-reimbursement-km').innerText = `R$ ${kmReimbursement.toFixed(2)}`;
    document.getElementById('dash-net-profit').innerText = `R$ ${netProfit.toFixed(2)}`;

    document.getElementById('detail-base-pay').innerText = `R$ ${parseFloat(params.basePay).toFixed(2)}`;
    document.getElementById('detail-total-fuel').innerText = `R$ ${totalFuel.toFixed(2)}`;
    document.getElementById('detail-caju-remaining').innerText = `R$ ${cajuRemaining.toFixed(2)}`;
    document.getElementById('detail-cost-per-km').innerText = `R$ ${costPerKm.toFixed(2)}/KM`;

    document.getElementById('pdf-total-km').innerText = totalKm;
    document.getElementById('pdf-calc-km').innerText = `${totalKm} KM × R$ ${parseFloat(params.kmRate).toFixed(2)} = R$ ${kmReimbursement.toFixed(2)}`;
    document.getElementById('pdf-final-reimbursement').innerText = `R$ ${netProfit.toFixed(2)}`;
}

function printPDF() {
    window.print();
}

document.addEventListener('DOMContentLoaded', () => {
    initParamsUI();
    renderHistory();
    calculateTotals();
});
