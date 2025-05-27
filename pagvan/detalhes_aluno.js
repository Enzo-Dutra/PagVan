// Script para carregar e gerenciar os detalhes do aluno em detalhes_aluno.html

console.log("detalhes_aluno.js carregado.");

// --- Constantes ---
const API_BASE_URL = "./api"; 

// --- Elementos do DOM ---
const detailsContent = document.getElementById("aluno-details-content");
const loadingMessage = document.getElementById("loading-details");
const confirmButton = document.getElementById("confirmar-alteracoes-btn");

// --- Estado ---
let currentAlunoData = null; // Armazena os dados atuais do aluno
let editModeFields = {}; // Guarda os campos que estão em modo de edição

// --- Funções Auxiliares ---

// Função para obter o ID do aluno da URL
function getAlunoIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
}

// Função para formatar valor em centavos para R$ (reutilizada)
function formatCurrency(valueInCents) {
    if (valueInCents === null || valueInCents === undefined) return "N/A";
    return "R$ " + (valueInCents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// --- Função para carregar detalhes do aluno ---
async function carregarDetalhesAluno() {
    const alunoId = getAlunoIdFromUrl();

    if (!alunoId) {
        loadingMessage.textContent = "ID do aluno não encontrado na URL.";
        loadingMessage.style.color = "red";
        return;
    }

    if (!detailsContent || !loadingMessage) {
        console.error("Elementos essenciais da página de detalhes não encontrados.");
        return;
    }

    loadingMessage.style.display = "block";
    detailsContent.innerHTML = ""; // Limpa conteúdo anterior

    try {
        const response = await fetch(`${API_BASE_URL}/get_aluno_detalhes.php?id=${alunoId}`, {
            method: "GET",
            headers: { "Accept": "application/json" }
        });

        if (!response.ok) {
            if (response.status === 404) {
                 throw new Error("Aluno não encontrado ou inativo.");
            } else {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
        }

        const result = await response.json();
        loadingMessage.style.display = "none";

        if (result.success && result.aluno) {
            currentAlunoData = result.aluno;
            renderAlunoDetails(currentAlunoData);
        } else {
            throw new Error(result.message || "Erro ao buscar dados do aluno.");
        }

    } catch (error) {
        console.error("Falha ao buscar detalhes do aluno:", error);
        loadingMessage.textContent = `Erro: ${error.message}`; 
        loadingMessage.style.color = "red";
        loadingMessage.style.display = "block";
    }
}

// --- Função para renderizar os detalhes na página ---
function renderAlunoDetails(aluno) {
    detailsContent.innerHTML = ""; // Limpa novamente para garantir

    const fields = [
        { key: "nome_crianca", label: "Nome da Criança", type: "text" },
        { key: "nome_responsavel", label: "Nome do Responsável", type: "text" },
        { key: "telefone_responsavel", label: "Telefone do Responsável", type: "tel" },
        { key: "horario", label: "Horário", type: "select", options: ["Manhã", "Tarde", "Integral"] },
        { key: "escola", label: "Escola", type: "text" },
        { key: "valor_mensalidade_centavos", label: "Valor da Mensalidade", type: "number", displayValue: formatCurrency(aluno.valor_mensalidade_centavos) },
        { key: "dia_vencimento", label: "Dia do Vencimento", type: "number", min: 1, max: 31 }
    ];

    fields.forEach(field => {
        const itemDiv = document.createElement("div");
        itemDiv.className = "detail-item";

        const label = document.createElement("label");
        label.textContent = `${field.label}:`;
        itemDiv.appendChild(label);

        // Cria o span para exibir o valor
        const valueSpan = document.createElement("span");
        valueSpan.className = "detail-value";
        valueSpan.id = `detail-${field.key}`;
        valueSpan.textContent = field.displayValue !== undefined ? field.displayValue : (aluno[field.key] || "N/A");
        itemDiv.appendChild(valueSpan);

        // Cria o botão "Alterar"
        const editButton = document.createElement("button");
        editButton.className = "btn-action btn-edit";
        editButton.dataset.field = field.key;
        editButton.dataset.type = field.type;
        if (field.options) editButton.dataset.options = JSON.stringify(field.options);
        if (field.min) editButton.dataset.min = field.min;
        if (field.max) editButton.dataset.max = field.max;
        editButton.textContent = "Alterar";
        editButton.addEventListener("click", handleEditClick);
        itemDiv.appendChild(editButton);

        detailsContent.appendChild(itemDiv);
    });
}

// --- Função para lidar com o clique no botão "Alterar" (Passo 5) ---
function handleEditClick(event) {
    const button = event.target;
    const fieldKey = button.dataset.field;
    const fieldType = button.dataset.type;
    const options = button.dataset.options ? JSON.parse(button.dataset.options) : null;
    const min = button.dataset.min;
    const max = button.dataset.max;
    
    const itemDiv = button.closest(".detail-item");
    const valueSpan = itemDiv.querySelector(".detail-value");

    if (!itemDiv || !valueSpan) return;

    // Esconde o span e o botão "Alterar"
    valueSpan.style.display = "none";
    button.style.display = "none";

    let inputElement;

    if (fieldType === "select" && options) {
        inputElement = document.createElement("select");
        options.forEach(opt => {
            const option = document.createElement("option");
            option.value = opt;
            option.textContent = opt;
            if (opt === currentAlunoData[fieldKey]) {
                option.selected = true;
            }
            inputElement.appendChild(option);
        });
    } else {
        inputElement = document.createElement("input");
        inputElement.type = fieldType === "number" ? "number" : (fieldType === "tel" ? "tel" : "text");
        inputElement.value = currentAlunoData[fieldKey] || "";
        if (fieldType === "number") {
            if (fieldKey === "valor_mensalidade_centavos") {
                // Para moeda, edita em Reais, converte depois
                inputElement.value = (currentAlunoData[fieldKey] / 100).toFixed(2);
                inputElement.step = "0.01";
            } else {
                 inputElement.value = currentAlunoData[fieldKey];
            }
            if (min) inputElement.min = min;
            if (max) inputElement.max = max;
        }
        if (fieldType === "tel") {
            // Adicionar máscara de telefone aqui se desejado
        }
    }
    
    inputElement.id = `edit-${fieldKey}`;
    inputElement.dataset.originalValue = currentAlunoData[fieldKey]; // Guarda valor original
    itemDiv.insertBefore(inputElement, button); // Insere antes do botão (que está oculto)

    editModeFields[fieldKey] = inputElement; // Registra que o campo está em edição
    confirmButton.style.display = "inline-block"; // Mostra o botão de confirmar geral
}

// --- Função para confirmar alterações (Passo 5) ---
async function confirmarAlteracoes() {
    const alunoId = getAlunoIdFromUrl();
    if (!alunoId) return;

    const updates = {};
    let hasChanges = false;

    for (const fieldKey in editModeFields) {
        const inputElement = editModeFields[fieldKey];
        let newValue = inputElement.value;
        let originalValue = inputElement.dataset.originalValue;

        // Tratamento especial para moeda (converter de R$ para centavos)
        if (fieldKey === "valor_mensalidade_centavos") {
            const newValueFloat = parseFloat(newValue.replace(",", "."));
            if (!isNaN(newValueFloat)) {
                newValue = Math.round(newValueFloat * 100);
            } else {
                alert("Valor da mensalidade inválido.");
                return; // Aborta se inválido
            }
            originalValue = parseFloat(originalValue); // Comparar números
        } else if (inputElement.type === "number") {
             newValue = parseInt(newValue, 10);
             originalValue = parseInt(originalValue, 10);
        }

        // Verifica se houve mudança
        // Usar != para comparação mais flexível (ex: 5 != "5" é false)
        // Usar !== para comparação estrita se necessário
        if (newValue != originalValue) { 
            updates[fieldKey] = newValue;
            hasChanges = true;
        }
    }

    if (!hasChanges) {
        alert("Nenhuma alteração detectada.");
        // Reverter para modo visualização
        Object.keys(editModeFields).forEach(revertToViewMode);
        editModeFields = {};
        confirmButton.style.display = "none";
        return;
    }

    console.log("Enviando atualizações:", updates);

    // Desabilitar botão de confirmação
    confirmButton.disabled = true;
    confirmButton.textContent = "Salvando...";

    try {
        // Chamar API para atualizar dados (a ser criada: api/update_aluno.php)
        const response = await fetch(`${API_BASE_URL}/update_aluno.php`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: alunoId, updates: updates })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            alert("Dados atualizados com sucesso!");
            // Atualiza os dados locais e re-renderiza
            currentAlunoData = { ...currentAlunoData, ...updates }; 
            renderAlunoDetails(currentAlunoData); // Re-renderiza com novos dados
            editModeFields = {}; // Limpa campos em edição
            confirmButton.style.display = "none"; // Esconde botão confirmar
        } else {
            alert(`Erro ao atualizar: ${result.message || "Erro desconhecido."}`);
        }

    } catch (error) {
        console.error("Erro na requisição de atualização:", error);
        alert("Erro de comunicação ao salvar alterações.");
    } finally {
        // Reabilitar botão de confirmação
        confirmButton.disabled = false;
        confirmButton.textContent = "Confirmar Alterações";
    }
}

// Função para reverter um campo para modo visualização
function revertToViewMode(fieldKey) {
    const inputElement = editModeFields[fieldKey];
    if (!inputElement) return;

    const itemDiv = inputElement.closest(".detail-item");
    const valueSpan = itemDiv.querySelector(".detail-value");
    const editButton = itemDiv.querySelector(".btn-edit");

    // Remove o input
    inputElement.remove();

    // Mostra o span e o botão novamente
    if (valueSpan) valueSpan.style.display = "";
    if (editButton) editButton.style.display = "";
}


// --- Inicialização ---
document.addEventListener("DOMContentLoaded", () => {
    carregarDetalhesAluno();
    // Adiciona listener ao botão de confirmação geral
    if (confirmButton) {
        confirmButton.addEventListener("click", confirmarAlteracoes);
    }
});

