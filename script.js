const ACCESS_KEY = "ACESSO@KM";

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
const modalTechName = document.getElementById("modal-tech-name");
const cfgTechName = document.getElementById("cfg-tech-name");

const btnShortcuts = document.getElementById("btn-shortcuts");
const modalShortcuts = document.getElementById("modal-shortcuts");
const btnCloseShortcuts = document.getElementById("btn-close-shortcuts");
const btnSaveShortcuts = document.getElementById("btn-save-shortcuts");
const shortcutHome = document.getElementById("shortcut-home");
const shortcutCompany = document.getElementById("shortcut-company");

const btnShortcutHome = document.getElementById("btn-shortcut-home");
const btnShortcutCompany = document.getElementById("btn-shortcut-company");

const cfgMonth = document.getElementById("cfg-month");
const cfgFixedAid = document.getElementById("cfg-fixed-aid");
const cfgKmRate = document.getElementById("cfg-km-rate");
const cfgCardRequested = document.getElementById("cfg-card-requested");

const travelClient = document.getElementById("travel-client");
const travelProtocol = document.getElementById("travel-protocol");
const travelKm = document.getElementById("travel-km");

const fuelPlace = document.getElementById("fuel-place");
const fuelValue = document.getElementById("fuel-value");

const sumKm = document.getElementById("sum-km");
const sumClients = document.getElementById("sum-clients");
const sumReimbursement = document.getElementById("sum-reimbursement");
const sumNet = document.getElementById("sum-net");

const detFixed = document.getElementById("det-fixed");
const detFuel = document.getElementById("det-fuel");
const detCaju = document.getElementById("det-caju");
const detCostKm = document.getElementById("det-cost-km");

const historyList = document.getElementById("history-list");
const btnClearData = document.getElementById("btn-clear-data");
const btnExportPdf = document.getElementById("btn-export-pdf");

let state = {
    settings: {
        techName: "Diego Santana",
        month: "JULHO/2026",
        fixedAid: 300.00,
        kmRate: 1.30,
        cardRequested: 250.00
    },
    shortcuts: {
        home: "",
        company: ""
    },
    records: []
};

function init() {
    loadData();
    setupListeners();
    updateUI();
}

function loadData() {
    const saved = localStorage.getItem("controle_operacional_state");
    if (saved) {
        state = JSON.parse(saved);
    }
}

function saveData() {
    localStorage.setItem("controle_operacional_state", JSON.stringify(state));
    updateUI();
}

function setupListeners() {
    btnLogin.addEventListener("click", () => {
        if (accessKeyInput.value === ACCESS_KEY) {
            authScreen.classList.remove("active");
            appScreen.classList.add("active");
        } else {
            alert("Chave incorreta!");
        }
    });

    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            tabBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            if(btn.dataset.tab === "tab-travel") {
                formTravel.classList.add("active");
                formFuel.classList.remove("active");
            } else {
                formTravel.classList.remove("active");
                formFuel.classList.add("active");
            }
        });
    });

    btnSettings.addEventListener("click", () => {
        modalTechName.value = state.settings.techName;
        modalSettings.classList.add("active");
    });
    btnCloseSettings.addEventListener("click", () => modalSettings.classList.remove("active"));
    btnSaveSettings.addEventListener("click", () => {
        state.settings.techName = modalTechName.value;
        saveData();
        modalSettings.classList.remove("active");
    });

    cfgTechName.addEventListener("click", () => {
        modalTechName.value = state.settings.techName;
        modalSettings.classList.add("active");
    });

    btnShortcuts.addEventListener("click", () => {
        shortcutHome.value = state.shortcuts.home;
        shortcutCompany.value = state.shortcuts.company;
        modalShortcuts.classList.add("active");
    });
    btnCloseShortcuts.addEventListener("click", () => modalShortcuts.classList.remove("active"));
    btnSaveShortcuts.addEventListener("click", () => {
        state.shortcuts.home = shortcutHome.value;
        state.shortcuts.company = shortcutCompany.value;
        saveData();
        modalShortcuts.classList.remove("active");
    });

    btnShortcutHome.addEventListener("click", () => {
        if(state.shortcuts.home) travelClient.value = state.shortcuts.home;
        else alert("Configure o endereço de casa nos atalhos (📍).");
    });

    btnShortcutCompany.addEventListener("click", () => {
        if(state.shortcuts.company) travelClient.value = state.shortcuts.company;
        else alert("Configure o endereço da empresa nos atalhos (📍).");
    });

    cfgMonth.addEventListener("input", (e) => { state.settings.month = e.target.value; saveData(); });
    cfgFixedAid.addEventListener("input", (e) => { state.settings.fixedAid = parseFloat(e.target.value) || 0; saveData(); });
    cfgKmRate.addEventListener("input", (e) => { state.settings.kmRate = parseFloat(e.target.value) || 0; saveData(); });
    cfgCardRequested.addEventListener("input", (e) => { state.settings.cardRequested = parseFloat(e.target.value) || 0; saveData(); });

    formTravel.addEventListener("submit", (e) => {
        e.preventDefault();
        state.records.push({
            id: Date.now(),
            type: "travel",
            client: travelClient.value,
            protocol: travelProtocol.value,
            km: parseFloat(travelKm.value) || 0,
            date: new Date().toLocaleDateString("pt-BR")
        });
        saveData();
        travelClient.value = "";
        travelProtocol.value = "";
        travelKm.value = "";
    });

    formFuel.addEventListener("submit", (e) => {
        e.preventDefault();
        state.records.push({
            id: Date.now(),
            type: "fuel",
            place: fuelPlace.value,
            value: parseFloat(fuelValue.value) || 0,
            date: new Date().toLocaleDateString("pt-BR")
        });
        saveData();
        fuelPlace.value = "";
        fuelValue.value = "";
    });

    btnClearData.addEventListener("click", () => {
        if(confirm("Deseja apagar os registros do mês?")) {
            state.records = [];
            saveData();
        }
    });

    btnExportPdf.addEventListener("click", () => window.print());
}

function updateUI() {
    cfgTechName.value = state.settings.techName || "Nome do Técnico";
    cfgMonth.value = state.settings.month || "";
    cfgFixedAid.value = state.settings.fixedAid;
    cfgKmRate.value = state.settings.kmRate;
    cfgCardRequested.value = state.settings.cardRequested;

    let totalKm = 0;
    let clientsCount = 0;
    let totalFuel = 0;

    let lastKm = 0;
    const travels = state.records.filter(r => r.type === "travel");
    clientsCount = travels.length;

    travels.forEach((t, index) => {
        if(index === 0) {
            lastKm = t.km;
        } else {
            let diff = t.km - lastKm;
            if(diff > 0) totalKm += diff;
            lastKm = t.km;
        }
    });

    state.records.filter(r => r.type === "fuel").forEach(f => {
        totalFuel += f.value;
    });

    const reimbursement = totalKm * state.settings.kmRate;
    const fixedAid = state.settings.fixedAid;
    const cajuRequested = state.settings.cardRequested;
    const netLiquid = fixedAid + reimbursement - totalFuel; // Ajuste conforme lógica de sobra líquida
    const cajuRemaining = cajuRequested - totalFuel;
    const costPerKm = totalKm > 0 ? (totalFuel / totalKm) : 0;

    sumKm.textContent = `${totalKm} KM`;
    sumClients.textContent = clientsCount;
    sumReimbursement.textContent = `R$ ${reimbursement.toFixed(2)}`;
    sumNet.textContent = `R$ ${netLiquid.toFixed(2)}`;

    detFixed.textContent = `R$ ${fixedAid.toFixed(2)}`;
    detFuel.textContent = `R$ ${totalFuel.toFixed(2)}`;
    detCaju.textContent = `R$ ${cajuRemaining.toFixed(2)}`;
    detCostKm.textContent = `R$ ${costPerKm.toFixed(2)}/KM`;

    renderHistory();
}

function renderHistory() {
    if(state.records.length === 0) {
        historyList.innerHTML = `<p class="empty-msg">Nenhum registro efetuado este mês.</p>`;
        return;
    }

    let html = "";
    [...state.records].reverse().forEach(r => {
        if(r.type === "travel") {
            html += `
                <div class="record-item">
                    <div><strong>${r.client}</strong><br><span style="font-size:0.7rem; color:#a0a0a0;">${r.date}</span></div>
                    <div>${r.protocol || '-'}</div>
                    <div>${r.km} KM</div>
                    <button class="btn-delete-record" onclick="deleteRecord(${r.id})">🗑️</button>
                </div>
            `;
        } else {
            html += `
                <div class="record-item" style="border-left: 3px solid #ef4444; padding-left: 6px;">
                    <div><strong>⛽ ${r.place}</strong><br><span style="font-size:0.7rem; color:#a0a0a0;">${r.date}</span></div>
                    <div>Gasto</div>
                    <div>R$ ${r.value.toFixed(2)}</div>
                    <button class="btn-delete-record" onclick="deleteRecord(${r.id})">🗑️</button>
                </div>
            `;
        }
    });
    historyList.innerHTML = html;
}

window.deleteRecord = function(id) {
    state.records = state.records.filter(r => r.id !== id);
    saveData();
}

init();
