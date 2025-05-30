// pagamentos_alunos.js

document.addEventListener("DOMContentLoaded", () => {
    console.log("pagamentos_alunos.js carregado.");

    // --- Elementos do DOM ---
    const alunoNomeSpan = document.getElementById("aluno-nome");
    const anoReferenciaSpan = document.getElementById("ano-referencia");
    const tableBody = document.getElementById("pagamentos-table-body");
    const loadingMessage = document.getElementById("loading-pagamentos");
    const errorMessage = document.getElementById("error-pagamentos");
    const feedbackDiv = document.getElementById("feedback-pagamentos");

    // --- Constantes e Variáveis ---
    const API_BASE_URL = "./api";
    const urlParams = new URLSearchParams(window.location.search);
    const alunoId = urlParams.get("id");
    const anoAtual = new Date().getFullYear(); // Usar ano atual como padrão

    // --- Funções ---

    // Função para buscar e exibir dados de pagamento
    async function carregarPagamentos() {
        if (!alunoId) {
            showError("ID do aluno não encontrado na URL.");
            return;
        }

        showLoading(true);
        errorMessage.style.display = "none";
        feedbackDiv.style.display = "none";
        tableBody.innerHTML = "";

        try {
            const response = await fetch(`${API_BASE_URL}/get_pagamentos_status.php?id=${alunoId}&ano=${anoAtual}`);
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
            const data = await response.json();

            showLoading(false);

            if (data.success) {
                if (alunoNomeSpan) alunoNomeSpan.textContent = data.nome_aluno || "Aluno";
                if (anoReferenciaSpan) anoReferenciaSpan.textContent = data.ano_referencia || anoAtual;
                displayPagamentos(data.pagamentos);
            } else {
                showError(data.message || "Erro ao buscar dados de pagamento.");
            }
        } catch (error) {
            showLoading(false);
            showError(`Falha ao carregar pagamentos: ${error.message}`);
            console.error("Erro ao buscar pagamentos:", error);
        }
    }

    // Função para exibir a tabela de pagamentos
    function displayPagamentos(pagamentos) {
        tableBody.innerHTML = ""; // Limpa tabela
        if (!pagamentos || pagamentos.length === 0) {
            // Isso não deve acontecer se a API sempre retornar 12 meses
            showError("Nenhum dado de pagamento recebido.");
            return;
        }

        pagamentos.forEach(pag => {
            const row = tableBody.insertRow();

            // Coluna Mês
            row.insertCell().textContent = pag.mes_nome;

            // Coluna Situação
            const statusCell = row.insertCell();
            const statusSpan = document.createElement("span");
            statusSpan.className = `status ${pag.classe_css}`;
            statusSpan.textContent = pag.status;
            statusCell.appendChild(statusSpan);

            // Coluna Ação
            const acaoCell = row.insertCell();
            if (pag.status === "Pendente" || pag.status === "Atrasado") {
                const btnMarcarPago = document.createElement("button");
                btnMarcarPago.textContent = "Marcar como Pago";
                btnMarcarPago.className = "btn-action btn-marcar-pago"; // Classe para estilo
                btnMarcarPago.dataset.mes = pag.mes_numero;
                btnMarcarPago.addEventListener("click", handleMarcarComoPago);
                acaoCell.appendChild(btnMarcarPago);
            } else if (pag.status === "Pago") {
                acaoCell.textContent = "-"; // Ou um ícone de check
            } else {
                 acaoCell.textContent = "-"; // Para status de erro
            }
        });
    }

    // Função para lidar com o clique em "Marcar como Pago"
    async function handleMarcarComoPago(event) {
        const button = event.target;
        const mes = button.dataset.mes;

        if (!confirm(`Confirma o pagamento para o mês ${mes}?`)) {
            return;
        }

        button.disabled = true;
        button.textContent = "Registrando...";
        showFeedback("", false);

        try {
            const response = await fetch(`${API_BASE_URL}/marcar_como_pago.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    aluno_id: alunoId, 
                    mes: parseInt(mes, 10),
                    ano: anoAtual 
                }),
            });
            const result = await response.json();

            if (response.ok && result.success) {
                showFeedback(result.message || "Pagamento registrado com sucesso!", true);
                // Atualiza a linha na tabela
                const row = button.closest("tr");
                if (row) {
                    const statusCell = row.cells[1];
                    const acaoCell = row.cells[2];
                    statusCell.innerHTML = 
                        '<span class="status status-pago">Pago</span>';
                    acaoCell.innerHTML = "-"; // Remove o botão
                }
            } else {
                showFeedback(result.message || "Erro ao registrar pagamento.", false);
                button.disabled = false;
                button.textContent = "Marcar como Pago";
            }
        } catch (error) {
            console.error("Erro na requisição de marcar como pago:", error);
            showFeedback("Erro de comunicação ao tentar registrar pagamento.", false);
            button.disabled = false;
            button.textContent = "Marcar como Pago";
        }
    }

    // Funções de UI (Loading, Error, Feedback)
    function showLoading(isLoading) {
        if (loadingMessage) loadingMessage.style.display = isLoading ? "block" : "none";
    }

    function showError(message) {
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.style.display = "block";
        }
    }

    function showFeedback(message, isSuccess) {
        if (feedbackDiv) {
            feedbackDiv.textContent = message;
            feedbackDiv.className = `form-feedback ${isSuccess ? "success" : "error"}`;
            feedbackDiv.style.display = "block";
        }
    }

    // --- Inicialização ---
    carregarPagamentos();

});

