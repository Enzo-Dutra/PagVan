// alunos_desligados.js

document.addEventListener("DOMContentLoaded", () => {
    const tabelaAlunosBody = document.querySelector("#alunos-desligados-table tbody");
    const loadingMessage = document.getElementById("loading-message");
    const noAlunosMessage = document.getElementById("no-alunos-message");
    const errorMessage = document.getElementById("error-message");
    const alunosTable = document.getElementById("alunos-desligados-table");

    const API_BASE_URL = "./api";

    async function fetchAlunosDesligados() {
        showLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/get_alunos_desligados.php`);
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
            const data = await response.json();
            showLoading(false);
            if (data.success && data.alunos) {
                displayAlunos(data.alunos);
            } else {
                showError(data.message || "Erro ao buscar alunos desligados.");
            }
        } catch (error) {
            showLoading(false);
            showError(`Não foi possível carregar os alunos: ${error.message}`);
            console.error("Erro ao buscar alunos desligados:", error);
        }
    }

    function displayAlunos(alunos) {
        tabelaAlunosBody.innerHTML = ""; // Limpa a tabela antes de adicionar novos dados
        if (alunos.length === 0) {
            noAlunosMessage.style.display = "block";
            alunosTable.style.display = "none";
            return;
        }

        alunosTable.style.display = "table";
        noAlunosMessage.style.display = "none";
        errorMessage.style.display = "none";

        alunos.forEach(aluno => {
            const row = tabelaAlunosBody.insertRow();
            
            // Coluna Aluno
            row.insertCell().textContent = aluno.nome_crianca;
            
            // Coluna Ação
            const acoesCell = row.insertCell();
            
            // Botão Reativar
            const btnReativar = document.createElement("button");
            btnReativar.textContent = "Reativar";
            btnReativar.className = "btn-action btn-reativar"; // Classe para estilização
            btnReativar.addEventListener("click", () => handleReativar(aluno.id, row));
            acoesCell.appendChild(btnReativar);
        });
    }

    async function handleReativar(alunoId, rowElement) {
        if (!confirm("Tem certeza que deseja reativar este aluno?")) {
            return;
        }

        const buttonElement = rowElement.querySelector(".btn-reativar");
        if(buttonElement) {
            buttonElement.disabled = true;
            buttonElement.textContent = "Reativando...";
        }

        try {
            const response = await fetch(`${API_BASE_URL}/reativar_aluno.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ aluno_id: alunoId }),
            });
            const result = await response.json();
            if (response.ok && result.success) {
                alert(result.message || "Aluno reativado com sucesso!");
                rowElement.remove(); 
                if (tabelaAlunosBody.rows.length === 0) {
                    noAlunosMessage.style.display = "block";
                    alunosTable.style.display = "none";
                }
            } else {
                alert(result.message || "Erro ao reativar aluno.");
                if(buttonElement) {
                    buttonElement.disabled = false;
                    buttonElement.textContent = "Reativar";
                }
                console.error("Erro ao reativar:", result);
            }
        } catch (error) {
            alert("Erro de comunicação ao tentar reativar o aluno.");
            if(buttonElement) {
                buttonElement.disabled = false;
                buttonElement.textContent = "Reativar";
            }
            console.error("Erro na requisição de reativar:", error);
        }
    }

    function showLoading(isLoading) {
        if (isLoading) {
            loadingMessage.style.display = "block";
            alunosTable.style.display = "none";
            noAlunosMessage.style.display = "none";
            errorMessage.style.display = "none";
        } else {
            loadingMessage.style.display = "none";
        }
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = "block";
        alunosTable.style.display = "none";
        noAlunosMessage.style.display = "none";
    }

    fetchAlunosDesligados();
});

