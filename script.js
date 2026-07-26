const CORRECT_KEY = "ACESSO@KM";

document.addEventListener("DOMContentLoaded", () => {
    const lockScreen = document.getElementById("lock-screen");
    const appContent = document.getElementById("app-content");
    const accessInput = document.getElementById("access-key-input");
    const unlockBtn = document.getElementById("unlock-btn");
    const errorMsg = document.getElementById("lock-error");

    let entries = JSON.parse(localStorage.getItem("app_entries")) || [];

    // Autenticação
    if (localStorage.getItem("app_authorized") === "true") {
        lockScreen.style.display = "none";
        appContent.style.display = "block";
        loadParameters();
        renderHistory();
        calculateSummary();
    }

    unlockBtn.addEventListener("click", () => {
        if (accessInput.value.trim() === CORRECT_KEY) {
            localStorage.setItem("app_authorized", "true");
            lockScreen.style.display = "none";
            appContent.style.display = "block";
            errorMsg.style.display = "none";
            loadParameters();
            renderHistory();
            calculateSummary();
        } else {
            errorMsg.style.display = "block";
            accessInput.value = "";
        }
    });

    // Parâmetros
    const editBtn = document.getElementById("edit-params-btn");
    const inputs = document.querySelectorAll(".parameters-card input");
    let isEditing = false;

    editBtn.addEventListener("click", () => {
        isEditing = !isEditing;
        inputs.forEach(input => input.disabled = !isEditing);
        editBtn.textContent = isEditing ? "Salvar Parâmetros" : "Editar Parâmetros";
        editBtn.style.backgroundColor = isEditing ? "#238636" : "";

        if (!isEditing) {
            saveParameters();
            calculateSummary();
        }
    });

    function saveParameters() {
        const params = {
            tech: document.getElementById("tech-name").value,
            month: document.getElementById("month-year").value,
            aid: document.getElementById("fixed-aid").value,
            rate: document.getElementById("km-rate").value,
            caju: document.getElementById("caju-value").value
        };
        localStorage.setItem("app_params", JSON.stringify(params));
    }

    function loadParameters() {
        const saved = localStorage.getItem("app_params");
        if (saved) {
            const params = JSON.parse(saved);
            document.getElementById("tech-name").value = params.tech || "";
            document.getElementById("month-year").value = params.month || "";
            document.getElementById("fixed-aid").value = params.aid || "";
            document.getElementById("km-rate").value = params.rate || "";
            document.getElementById("caju-value").value = params.caju || "";
        }
    }

    // Alternar abas de Lançamento (Parada vs Abastecimento)
    const btnParada = document.getElementById("btn-parada");
    const btnAbastecimento = document.getElementById("btn-abastecimento");
    const formTitle = document.getElementById("form-title");
    const saveEntryBtn = document.getElementById("save-entry-btn");
    let currentMode = "parada";

    btnParada.addEventListener("click", () => {
        currentMode = "parada";
        btnParada.classList.add("active");
        btnAbastecimento.classList.remove("active");
        formTitle.textContent = "Registro de KM / Atendimento";
        saveEntryBtn.textContent = "Salvar Parada";
    });

    btnAbastecimento.addEventListener("click", () => {
        currentMode = "abastecimento";
        btnAbastecimento.classList.add("active");
        btnParada.classList.remove("active");
        formTitle.textContent = "Registro de Abastecimento";
        saveEntryBtn.textContent = "Salvar Abastecimento";
    });

    // Atalhos Rápidos
    document.getElementById("shortcut-casa").addEventListener("click", () => {
        document.getElementById("local-name").value = "Casa";
    });
    document.getElementById("shortcut-empresa").addEventListener("click", () => {
        document.getElementById("local-name").value = "Empresa";
    });

    // Salvar Lançamento
    saveEntryBtn.addEventListener("click", () => {
        const local = document.getElementById("local-name").value.trim();
        const protocol = document.getElementById("protocol-num").value.trim();
        const km = document.getElementById("current-km").value.trim();

        if (!local || !km) {
            alert("Preencha o local e a KM atual.");
            return;
        }

        const entry = {
            id: Date.now(),
            mode: currentMode,
            local,
            protocol: protocol || "-",
            km: parseFloat(km)
        };

        entries.push(entry);
        localStorage.setItem("app_entries", JSON.stringify(entries));

        document.getElementById("local-name").value = "";
        document.getElementById("protocol-num").value = "";
        document.getElementById("current-km").value = "";

        renderHistory();
        calculateSummary();
    });

    function renderHistory() {
        const tbody = document.getElementById("history-tbody");
        if (entries.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 16px; color: #8b949e;">Nenhum registro efetuado este mês.</td></tr>`;
            return;
        }

        tbody.innerHTML = "";
        entries.forEach((item) => {
            const tr = document.createElement("tr");
            tr.style.borderBottom = "1px solid #30363d";
            tr.innerHTML = `
                <td style="padding: 8px;">${item.local} ${item.mode === 'abastecimento' ? '⛽' : ''}</td>
                <td style="padding: 8px;">${item.protocol}</td>
                <td style="padding: 8px;">${item.km} KM</td>
                <td style="padding: 8px; text-align: center;"><button onclick="deleteEntry(${item.id})" style="background:none; border:none; color:#f85149; cursor:pointer;">❌</button></td>
            `;
            tbody.appendChild(tr);
        });
    }

    window.deleteEntry = function(id) {
        entries = entries.filter(e => e.id !== id);
        localStorage.setItem("app_entries", JSON.stringify(entries));
        renderHistory();
        calculateSummary();
    };

    function calculateSummary() {
        let totalKm = entries.reduce((acc, curr) => acc + (curr.mode === 'parada' ? curr.km : 0), 0);
        let totalClients = entries.filter(e => e.mode === 'parada').length;
        
        const rate = parseFloat(document.getElementById("km-rate").value) || 0;
        const aid = parseFloat(document.getElementById("fixed-aid").value) || 0;
        const caju = parseFloat(document.getElementById("caju-value").value) || 0;

        let reimbursement = totalKm * rate;
        let netProfit = aid + caju; // Lógica padrão do painel

        document.getElementById("res-total-km").textContent = totalKm + " KM";
        document.getElementById("res-total-clients").textContent = totalClients;
        document.getElementById("res-reimbursement").textContent = "R$ " + reimbursement.toFixed(2);
        document.getElementById("res-net-profit").textContent = "R$ " + netProfit.toFixed(2);

        document.getElementById("det-aid").textContent = "R$ " + aid.toFixed(2);
        document.getElementById("det-fuel").textContent = "R$ 0,00";
        document.getElementById("det-caju").textContent = "R$ " + caju.toFixed(2);
        document.getElementById("det-cost-km").textContent = "R$ 0,00/KM";
    }

    document.getElementById("generate-pdf-btn").addEventListener("click", () => {
        window.print();
    });

    document.getElementById("clear-data-btn").addEventListener("click", () => {
        if (confirm("Deseja realmente apagar todos os registros do mês?")) {
            entries = [];
            localStorage.removeItem("app_entries");
            renderHistory();
            calculateSummary();
        }
    });
});
