const ACCESS_KEY = "ACESSO@KM";

// DOM Elements
const authScreen = document.getElementById("auth-screen");
const appScreen = document.getElementById("app-screen");
const accessKeyInput = document.getElementById("access-key-input");
const btnLogin = document.getElementById("btn-login");

const tabBtns = document.querySelectorAll(".tab-btn");
const formTravel = document.getElementById("form-travel");
const formFuel = document.getElementById("form-fuel");

const btnSettings = document.getElementById("btn-settings");
const modalSettings = document.getElementById("modal-settings");
const btnCloseSettings = document.getElementById("btn-close-settings");
const btnSaveSettings = document.getElementById("btn-save-settings");

const btnShortcuts = document.getElementById("btn-shortcuts");
const modalShortcuts = document.getElementById("modal-shortcuts");
const btnCloseShortcuts = document.getElementById("btn-close-shortcuts");
const btnSaveShortcuts = document.getElementById("btn-save-shortcuts");

const cfgTechName = document.getElementById("cfg-tech-name");
const cfgKmRate = document.getElementById("cfg-km-rate");
const cfgCardRequested = document.getElementById("cfg-card-requested");
const cfgFixedAid = document.getElementById("cfg-fixed-aid");

const shortcutHome = document.getElementById("shortcut-home");
const shortcutCompany = document.getElementById("shortcut-company");

const travelMonth = document.getElementById("travel-month");
const travelClient = document.getElementById("travel-client");
const travelProtocol = document.getElementById("travel-protocol");
const travelKm = document.getElementById("travel-km");

const fuelMonth = document.getElementById("fuel-month");
const fuelPlace = document.getElementById("fuel-place");
const fuelValue = document.getElementById("fuel-value");

const sumKm = document.getElementById("sum-km");
const sumReimbursement = document.getElementById("sum-reimbursement");
const sumFuel = document.getElementById("sum-fuel");
const sumCardBalance = document.getElementById("sum-card-balance");
const historyList = document.getElementById("history-list");

const btnClearData = document.getElementById("btn-clear-data");
const btnExportPdf = document.getElementById("btn-export-pdf");

// App State
let state = {
    settings: {
        techName: "",
        kmRate: "",
        cardRequested: "",
        fixedAid: "0.00"
    },
    shortcuts: {
        home: "",
        company: ""
    },
    records: []
};

// Initialize
function init() {
    loadData();
    setupEventListeners();
}

function loadData() {
    const savedState = localStorage.getItem("field_service_state");
    if (savedState) {
        state = JSON.parse(savedState);
    }
    updateSettingsUI();
}

function saveData() {
    localStorage.setItem("field_service_state", JSON.stringify(state));
    updateSummaryAndHistory();
}

function updateSettingsUI() {
    cfgTechName.value = state.settings.techName || "";
    cfgKmRate.value = state.settings.kmRate || "";
    cfgCardRequested.value = state.settings.cardRequested || "";
    cfgFixedAid.value = state.settings.fixedAid !== undefined ? state.settings.fixedAid : "0.00";

    shortcutHome.value = state.shortcuts.home || "";
    shortcutCompany.value = state.shortcuts.company || "";
    
    updateSummaryAndHistory();
}

function setupEventListeners() {
    btnLogin.addEventListener("click", () => {
        if (accessKeyInput.value === ACCESS_KEY) {
            authScreen.classList.remove("active");
            appScreen.classList.add("active");
        } else {
            alert("Chave de acesso incorreta!");
        }
    });

    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            tabBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            const targetTab = btn.getAttribute("data-tab");
            if (targetTab === "tab-travel") {
                formTravel.classList.add("active");
                formFuel.classList.remove("active");
            } else {
                formTravel.classList.remove("active");
                formFuel.classList.add("active");
            }
        });
    });

    btnSettings.addEventListener("click", () => modalSettings.classList.add("active"));
    btnCloseSettings.addEventListener("click", () => modalSettings.classList.remove("active"));
    
    btnSaveSettings.addEventListener("click", () => {
        state.settings.techName = cfgTechName.value;
        state.settings.kmRate = cfgKmRate.value;
        state.settings.cardRequested = cfgCardRequested.value;
        state.settings.fixedAid = cfgFixedAid.value;
        saveData();
        modalSettings.classList.remove("active");
    });

    btnShortcuts.addEventListener("click", () => modalShortcuts.classList.add("active"));
    btnCloseShortcuts.addEventListener("click", () => modalShortcuts.classList.remove("active"));

    btnSaveShortcuts.addEventListener("click", () => {
        state.shortcuts.home = shortcutHome.value;
        state.shortcuts.company = shortcutCompany.value;
        saveData();
        modalShortcuts.classList.remove("active");
    });

    formTravel.addEventListener("submit", (e) => {
        e.preventDefault();
        const kmVal = parseFloat(travelKm.value);
        
        const newRecord = {
            id: Date.now(),
            type: "travel",
            month: travelMonth.value,
            client: travelClient.value,
            protocol: travelProtocol.value,
            km: kmVal,
            timestamp: new Date().toISOString()
        };

        state.records.push(newRecord);
        saveData();
        formTravel.reset();
    });

    formFuel.addEventListener("submit", (e) => {
        e.preventDefault();
        const val = parseFloat(fuelValue.value);

        const newRecord = {
            id: Date.now(),
            type: "fuel",
            month: fuelMonth.value,
            place: fuelPlace.value,
            value: val,
            timestamp: new Date().toISOString()
        };

        state.records.push(newRecord);
        saveData();
        formFuel.reset();
    });

    btnClearData.addEventListener("click", () => {
        if (confirm("Deseja realmente limpar todos os registros?")) {
            state.records = [];
            saveData();
        }
    });

    btnExportPdf.addEventListener("click", () => {
        window.print();
    });
}

function updateSummaryAndHistory() {
    let totalKm = 0;
    let totalFuel = 0;
    
    const kmRate = parseFloat(state.settings.kmRate) || 0;
    const cardRequested = parseFloat(state.settings.cardRequested) || 0;

    // Calcular KM percorrido relativo
    let lastKm = 0;
    const sortedTravels = [...state.records]
        .filter(r => r.type === "travel")
        .sort((a, b) => a.id - b.id);

    sortedTravels.forEach((t, idx) => {
        if (idx === 0) {
            lastKm = t.km;
        } else {
            let diff = t.km - lastKm;
            if (diff > 0) totalKm += diff;
            lastKm = t.km;
        }
    });

    state.records.forEach(r => {
        if (r.type === "fuel") {
            totalFuel += r.value;
        }
    });

    let totalReimbursement = totalKm * kmRate;
    let cardBalance = cardRequested - totalFuel;

    sumKm.textContent = `${totalKm} km`;
    sumReimbursement.textContent = `R$ ${totalReimbursement.toFixed(2)}`;
    sumFuel.textContent = `R$ ${totalFuel.toFixed(2)}`;
    sumCardBalance.textContent = `R$ ${cardBalance.toFixed(2)}`;

    renderHistory();
}

function renderHistory() {
    if (state.records.length === 0) {
        historyList.innerHTML = `<p class="empty-msg">Nenhum registro encontrado.</p>`;
        return;
    }

    // Agrupar por data (dia)
    const grouped = {};
    state.records.forEach(r => {
        const dateStr = new Date(r.id).toLocaleDateString("pt-BR");
        if (!grouped[dateStr]) grouped[dateStr] = [];
        grouped[dateStr].push(r);
    });

    let html = "";
    Object.keys(grouped).sort().reverse().forEach(date => {
        html += `<div class="day-group">
            <div class="day-title">Data: ${date}</div>`;
        
        grouped[date].forEach(r => {
            if (r.type === "travel") {
                html += `
                    <div class="record-item">
                        <div class="record-info">
                            <strong>Viagem: ${r.client}</strong>
                            <span class="record-details">Mês: ${r.month} | KM: ${r.km} ${r.protocol ? '| Prot: ' + r.protocol : ''}</span>
                        </div>
                        <button class="btn-delete-record" onclick="deleteRecord(${r.id})">🗑️</button>
                    </div>
                `;
            } else {
                html += `
                    <div class="record-item">
                        <div class="record-info">
                            <strong>Gasto: ${r.place}</strong>
                            <span class="record-details">Mês: ${r.month} | Valor: R$ ${r.value.toFixed(2)}</span>
                        </div>
                        <button class="btn-delete-record" onclick="deleteRecord(${r.id})">🗑️</button>
                    </div>
                `;
            }
        });
        html += `</div>`;
    });

    historyList.innerHTML = html;
}

window.deleteRecord = function(id) {
    state.records = state.records.filter(r => r.id !== id);
    saveData();
};

init();
