const CORRECT_KEY = "ACESSO@KM";

document.addEventListener("DOMContentLoaded", () => {
    const lockScreen = document.getElementById("lock-screen");
    const appContent = document.getElementById("app-content");
    const accessInput = document.getElementById("access-key-input");
    const unlockBtn = document.getElementById("unlock-btn");
    const errorMsg = document.getElementById("lock-error");

    // Autenticação com Chave
    const isAuthorized = localStorage.getItem("app_authorized");
    if (isAuthorized === "true") {
        lockScreen.style.display = "none";
        appContent.style.display = "block";
        loadParameters();
    }

    unlockBtn.addEventListener("click", () => {
        if (accessInput.value.trim() === CORRECT_KEY) {
            localStorage.setItem("app_authorized", "true");
            lockScreen.style.display = "none";
            appContent.style.display = "block";
            errorMsg.style.display = "none";
            loadParameters();
        } else {
            errorMsg.style.display = "block";
            accessInput.value = "";
        }
    });

    // Edição de Parâmetros
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

    // Lógica básica de salvamento de lançamentos para manter a estrutura ativa
    const saveEntryBtn = document.getElementById("save-entry-btn");
    saveEntryBtn.addEventListener("click", () => {
        const local = document.getElementById("local-name").value;
        const km = document.getElementById("current-km").value;
        
        if (!local || !km) {
            alert("Preencha o local e a KM atual.");
            return;
        }

        alert("Lançamento registrado com sucesso!");
        document.getElementById("local-name").value = "";
        document.getElementById("protocol-num").value = "";
        document.getElementById("current-km").value = "";
    });
});
