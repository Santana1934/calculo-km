let mode = 'parada';
let entries = JSON.parse(localStorage.getItem('km_entries')) || [];

const BASE_PAY = 300;
const KM_RATE = 1.30;
const CAJU_BUDGET = 250;

function setMode(newMode) {
    mode = newMode;
    document.getElementById('btn-mode-parada').classList.toggle('active', mode === 'parada');
    document.getElementById('btn-mode-abastecimento').classList.toggle('active', mode === 'abastecimento');
    
    const fieldsParada = document.getElementById('fields-parada');
    const fieldsAbastecimento = document.getElementById('fields-abastecimento');

    if (mode === 'parada') {
        fieldsParada.style.display = 'block';
        fieldsAbastecimento.style.display = 'none';
    } else {
        fieldsParada.style.display = 'none';
        fieldsAbastecimento.style.display = 'block';
    }
}

function addEntry() {
    const dateInput = document.getElementById('input-date').value;
    if (!dateInput) {
        alert('Selecione uma data.');
        return;
    }

    if (mode === 'parada') {
        const client = document.getElementById('input-client').value;
        const os = document.getElementById('input-os').value;
        const km = parseFloat(document.getElementById('input-km').value) || 0;

        if (!client) {
            alert('Informe o cliente/local.');
            return;
        }

        entries.push({
            id: Date.now(),
            type: 'parada',
            date: dateInput,
            client,
            os: os || '-',
            km
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
            date: dateInput,
            valor: fuel
        });
    }

    saveAndRender();
    clearInputs();
}

function deleteEntry(id) {
    if (confirm('Deseja realmente apagar este registro?')) {
        entries = entries.filter(e => e.id !== id);
        saveAndRender();
    }
}

function clearAll() {
    if (confirm('Tem certeza que deseja apagar todos os registros do mês?')) {
        entries = [];
        saveAndRender();
    }
}

function saveAndRender() {
    localStorage.setItem('km_entries', JSON.stringify(entries));
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
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Nenhum registro encontrado.</td></tr>';
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
                <td><button class="btn-icon-subtle delete no-print" onclick="deleteEntry(${item.id})">×</button></td>
            `;
        } else {
            tr.innerHTML = `
                <td>${item.client}</td>
                <td>${item.os}</td>
                <td>+${item.km} KM</td>
                <td><button class="btn-icon-subtle delete no-print" onclick="deleteEntry(${item.id})">×</button></td>
            `;
        }
        tbody.appendChild(tr);
    });
}

function calculateTotals() {
    let totalKm = 0;
    let totalFuel = 0;

    entries.forEach(item => {
        if (item.type === 'parada') totalKm += item.km;
        if (item.type === 'abastecimento') totalFuel += item.valor;
    });

    const kmReimbursement = totalKm * KM_RATE;
    const totalReimbursement = BASE_PAY + kmReimbursement;
    const cajuRemaining = CAJU_BUDGET - totalFuel;

    document.getElementById('total-km').innerText = totalKm;
    document.getElementById('total-reimbursement').innerText = `R$ ${totalReimbursement.toFixed(2)}`;
    document.getElementById('caju-remaining').innerText = `R$ ${cajuRemaining.toFixed(2)}`;
}

function printPDF() {
    window.print();
}

document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('input-date').value = today;
    renderHistory();
    calculateTotals();
});
