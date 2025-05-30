// Script para carregar e gerenciar a lista de alunos em lista_alunos.html

console.log("lista_alunos.js carregado.");

// --- Constantes ---
const API_BASE_URL = "./api"; 

// --- Elementos do DOM ---
const tableBody = document.getElementById("alunos-table-body");
const loadingMessage = document.getElementById("loading-message");
const noAlunosMessage = document.getElementById("no-alunos-message");

// --- Função para carregar alunos ---
async function carregarAlunos() {
    if (!tableBody || !loadingMessage || !noAlunosMessage) {
        console.error("Elementos essenciais da tabela não encontrados.");
        return;
    }

    loadingMessage.style.display = "block";
    noAlunosMessage.style.display = "none";
    tableBody.innerHTML = ""; // Limpa a tabela antes de carregar

    try {
        const response = await fetch(`${API_BASE_URL}/get_alunos.php`, {
            method: "GET",
            headers: { "Accept": "application/json" } 
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const result = await response.json();

        loadingMessage.style.display = "none";

        if (result.success && result.alunos && result.alunos.length > 0) {
            result.alunos.forEach(aluno => {
                const row = tableBody.insertRow();

                const cellNome = row.insertCell();
                cellNome.textContent = aluno.nome;

                const cellVencimento = row.insertCell();
                cellVencimento.textContent = aluno.vencimento_texto;

                const cellSituacao = row.insertCell();
                const statusSpan = document.createElement("span");
                statusSpan.className = `status ${aluno.situacao_classe}`;
                statusSpan.textContent = aluno.situacao;
                cellSituacao.appendChild(statusSpan);

                const cellAcoes = row.insertCell();
                
                // Botão Detalhes
                const detailsButton = document.createElement("button");
                detailsButton.className = "btn-action btn-details";
                detailsButton.textContent = "Detalhes";
                detailsButton.dataset.alunoId = aluno.id;
                detailsButton.addEventListener("click", () => {
                    window.location.href = `detalhes_aluno.html?id=${aluno.id}`;
                });
                cellAcoes.appendChild(detailsButton);

                // NOVO: Botão Pagamentos (Amarelo)
                const pagamentosButton = document.createElement("button");
                pagamentosButton.className = "btn-action btn-pagamentos"; // Nova classe para estilo amarelo
                pagamentosButton.textContent = "Pagamentos";
                pagamentosButton.dataset.alunoId = aluno.id;
                pagamentosButton.addEventListener("click", () => {
                    window.location.href = `pagamentos_alunos.html?id=${aluno.id}`;
                });
                cellAcoes.appendChild(pagamentosButton);

                // Botão Dar Baixa
                const payButton = document.createElement("button");
                payButton.className = "btn-action btn-pay";
                payButton.textContent = "Dar Baixa";
                payButton.dataset.alunoId = aluno.id;
                payButton.addEventListener("click", () => {
                    darBaixaPagamento(aluno.id, payButton, row);
                });
                cellAcoes.appendChild(payButton);

                // Botão Desativar Aluno
                const deactivateButton = document.createElement("button");
                deactivateButton.className = "btn-action btn-deactivate";
                deactivateButton.textContent = "Desativar";
                deactivateButton.dataset.alunoId = aluno.id;
                deactivateButton.addEventListener("click", () => {
                    desativarAluno(aluno.id, row);
                });
                cellAcoes.appendChild(deactivateButton);
            });
        } else if (result.success && result.alunos.length === 0) {
            noAlunosMessage.style.display = "block";
        } else {
            console.error("Erro ao buscar alunos:", result.message);
            noAlunosMessage.textContent = "Erro ao carregar alunos.";
            noAlunosMessage.style.display = "block";
        }

    } catch (error) {
        console.error("Falha ao buscar alunos:", error);
        loadingMessage.style.display = "none";
        noAlunosMessage.textContent = "Falha na comunicação com o servidor.";
        noAlunosMessage.style.display = "block";
    }
}

// --- Função para Dar Baixa ---
async function darBaixaPagamento(alunoId, buttonElement, rowElement) {
    if (!confirm(`Confirma o recebimento do pagamento para o aluno ID ${alunoId}?`)) {
        return;
    }
    buttonElement.disabled = true;
    buttonElement.textContent = "Processando...";

    try {
        const response = await fetch(`${API_BASE_URL}/dar_baixa.php`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ aluno_id: alunoId })
        });
        const result = await response.json();
        if (response.ok && result.success) {
            alert(result.message);
            if (rowElement) {
                const statusSpan = rowElement.querySelector(".status");
                if (statusSpan) {
                    statusSpan.className = "status status-em-dia";
                    statusSpan.textContent = "Em dia";
                }
            }
            buttonElement.textContent = "Baixado";
        } else {
            alert(result.message || "Erro ao registrar baixa.");
            buttonElement.disabled = false;
            buttonElement.textContent = "Dar Baixa";
        }
    } catch (error) {
        console.error("Erro na requisição de dar baixa:", error);
        alert("Erro de comunicação ao tentar dar baixa.");
        buttonElement.disabled = false;
        buttonElement.textContent = "Dar Baixa";
    }
}

// --- Função para Desativar Aluno ---
async function desativarAluno(alunoId, rowElement) {
    if (!confirm(`Tem certeza que deseja desativar o aluno ID ${alunoId}? Este aluno será movido para a lista de desligados.`)) {
        return;
    }

    const buttonElement = rowElement.querySelector(".btn-deactivate");
    if(buttonElement) {
        buttonElement.disabled = true;
        buttonElement.textContent = "Desativando...";
    }

    try {
        const response = await fetch(`${API_BASE_URL}/desativar_aluno.php`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ aluno_id: alunoId })
        });
        const result = await response.json();
        if (response.ok && result.success) {
            alert(result.message || "Aluno desativado com sucesso!");
            rowElement.remove(); // Remove a linha da tabela de ativos
            // Verifica se a tabela ficou vazia
            if (tableBody.rows.length === 0) {
                noAlunosMessage.style.display = "block";
            }
        } else {
            alert(result.message || "Erro ao desativar aluno.");
            if(buttonElement) {
                buttonElement.disabled = false;
                buttonElement.textContent = "Desativar";
            }
        }
    } catch (error) {
        console.error("Erro na requisição de desativar aluno:", error);
        alert("Erro de comunicação ao tentar desativar o aluno.");
        if(buttonElement) {
            buttonElement.disabled = false;
            buttonElement.textContent = "Desativar";
        }
    }
}

// --- Inicialização ---
document.addEventListener("DOMContentLoaded", carregarAlunos);

