const CORRECT_KEY = "ACESSO@KM";

document.addEventListener("DOMContentLoaded", () => {
    const lockScreen = document.getElementById("lock-screen");
    const appContent = document.getElementById("app-content");
    const accessInput = document.getElementById("access-key-input");
    const unlockBtn = document.getElementById("unlock-btn");
    const errorMsg = document.getElementById("lock-error");

    // Verifica se já foi autenticado anteriormente neste aparelho
    const isAuthorized = localStorage.getItem("app_authorized");

    if (isAuthorized === "true") {
        lockScreen.style.display = "none";
        appContent.style.display = "block";
    }

    unlockBtn.addEventListener("click", () => {
        if (accessInput.value.trim() === CORRECT_KEY) {
            localStorage.setItem("app_authorized", "true");
            lockScreen.style.display = "none";
            appContent.style.display = "block";
            errorMsg.style.display = "none";
        } else {
            errorMsg.style.display = "block";
            accessInput.value = "";
        }
    });

    // Lógica para liberação da edição dos parâmetros
    const editBtn = document.getElementById("edit-params-btn");
    const inputs = document.querySelectorAll(".parameters-card input");
    let isEditing = false;

    editBtn.addEventListener("click", () => {
        isEditing = !isEditing;
        inputs.forEach(input => input.disabled = !isEditing);
        editBtn.textContent = isEditing ? "Salvar Parâmetros" : "Editar Parâmetros";
        editBtn.style.backgroundColor = isEditing ? "#238636" : "";
    });
});
