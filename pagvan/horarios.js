document.addEventListener("DOMContentLoaded", () => {
    console.log("horarios.js carregado.");

    const filtroEscolaSelect = document.getElementById("filtro-escola");
    const filtroHorarioSelect = document.getElementById("filtro-horario");
    const horariosContentDiv = document.getElementById("horarios-content");
    const loadingMessage = document.getElementById("loading-horarios");

    const API_BASE_URL = "./api"; // Ajuste se necessário

    // --- Função para carregar escolas no filtro ---
    async function carregarEscolas() {
        try {
            const response = await fetch(`${API_BASE_URL}/get_escolas.php`);
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
            const data = await response.json();

            if (data.success && data.escolas) {
                // Limpa opções existentes (exceto a primeira "Todas")
                filtroEscolaSelect.innerHTML = 
                    '<option value="">Todas as Escolas</option>'; 
                
                data.escolas.forEach(escola => {
                    const option = document.createElement("option");
                    option.value = escola;
                    option.textContent = escola;
                    filtroEscolaSelect.appendChild(option);
                });
            } else {
                console.error("Erro ao carregar escolas:", data.message || "Formato de resposta inválido");
            }
        } catch (error) {
            console.error("Falha ao buscar escolas:", error);
            // Poderia exibir uma mensagem para o usuário aqui
        }
    }

    // --- Função para carregar e exibir alunos com base nos filtros ---
    async function carregarAlunos() {
        const escolaSelecionada = filtroEscolaSelect.value;
        const horarioSelecionado = filtroHorarioSelect.value;

        loadingMessage.style.display = "block"; // Mostra "Carregando..."
        horariosContentDiv.innerHTML = ""; // Limpa conteúdo anterior (exceto o loading)
        horariosContentDiv.appendChild(loadingMessage);

        // Monta a URL da API com os parâmetros de filtro
        let apiUrl = `${API_BASE_URL}/get_alunos_horarios.php?`;
        const params = [];
        if (escolaSelecionada) {
            params.push(`escola=${encodeURIComponent(escolaSelecionada)}`);
        }
        if (horarioSelecionado) {
            params.push(`horario=${encodeURIComponent(horarioSelecionado)}`);
        }
        apiUrl += params.join("&");

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
            const data = await response.json();

            loadingMessage.style.display = "none"; // Esconde "Carregando..."

            if (data.success && data.alunos) {
                if (data.alunos.length === 0) {
                    horariosContentDiv.innerHTML = 
                        '<p class="no-alunos-message">Nenhum aluno encontrado com os filtros selecionados.</p>';
                } else {
                    exibirAlunosAgrupados(data.alunos);
                }
            } else {
                console.error("Erro ao carregar alunos:", data.message || "Formato de resposta inválido");
                horariosContentDiv.innerHTML = 
                    '<p class="error-message">Erro ao carregar alunos. Tente novamente.</p>';
            }
        } catch (error) {
            console.error("Falha ao buscar alunos:", error);
            loadingMessage.style.display = "none";
            horariosContentDiv.innerHTML = 
                '<p class="error-message">Falha na comunicação com o servidor ao buscar alunos.</p>';
        }
    }

    // --- Função para exibir os alunos agrupados por horário ---
    function exibirAlunosAgrupados(alunos) {
        horariosContentDiv.innerHTML = ""; // Limpa completamente

        // Agrupa alunos por horário
        const alunosPorHorario = {
            "Manhã": [],
            "Tarde": [],
            "Integral": []
        };

        alunos.forEach(aluno => {
            if (alunosPorHorario.hasOwnProperty(aluno.horario)) {
                alunosPorHorario[aluno.horario].push(aluno);
            }
            // Poderia ter um grupo "Outro" ou logar se o horário não for um dos esperados
        });

        // Cria a estrutura HTML para cada grupo
        for (const horario in alunosPorHorario) {
            if (alunosPorHorario[horario].length > 0) {
                const section = document.createElement("section");
                section.classList.add("horario-group");
                
                const title = document.createElement("h3");
                title.classList.add("horario-group-title");
                title.textContent = horario;
                section.appendChild(title);

                const list = document.createElement("ul");
                list.classList.add("aluno-list-horario");

                alunosPorHorario[horario].forEach(aluno => {
                    const listItem = document.createElement("li");
                    listItem.classList.add("aluno-list-item");
                    // Exibe nome e escola (pode adicionar mais detalhes se quiser)
                    listItem.innerHTML = `
                        <span class="aluno-nome">${aluno.nome_crianca}</span>
                        <span class="aluno-escola">(${aluno.escola || 'Escola não informada'})</span>
                        <a href="detalhes_aluno.html?id=${aluno.id}" class="btn-action btn-details-small" title="Ver Detalhes">Detalhes</a>
                    `;
                    list.appendChild(listItem);
                });

                section.appendChild(list);
                horariosContentDiv.appendChild(section);
            }
        }
    }

    // --- Adiciona listeners aos filtros ---
    filtroEscolaSelect.addEventListener("change", carregarAlunos);
    filtroHorarioSelect.addEventListener("change", carregarAlunos);

    // --- Carregamento inicial ---
    carregarEscolas(); // Carrega as escolas no filtro
    carregarAlunos(); // Carrega os alunos (inicialmente sem filtros)

    console.log("Listeners e carregamento inicial da tela de horários configurados.");
});

