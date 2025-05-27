// Script para validação e máscaras do formulário de Cadastro de Criança


console.log("cadastro_crianca_validation.js carregado.");


// --- Constantes ---
const API_BASE_URL = "./api";


// --- Elementos do DOM ---
const formCadastroCrianca = document.getElementById("form-cadastro-crianca");
const nomeCrianca = document.getElementById("nome-crianca");
const nomeResponsavel = document.getElementById("nome-responsavel");
const telefoneResponsavel = document.getElementById("telefone-responsavel");
const horario = document.getElementById("horario");
const escola = document.getElementById("escola");
const valorMensalidadeInput = document.getElementById("valor-mensalidade");
const dataVencimento = document.getElementById("data-vencimento");


// --- Funções Auxiliares ---
function formatPhone(value) {
    const digits = value.replace(/\D/g, "");
    let formatted = "";
    if (digits.length > 0) formatted = "(" + digits.substring(0, 2);
    if (digits.length > 2) formatted += ") " + digits.substring(2, 7);
    if (digits.length > 7) formatted += "-" + digits.substring(7, 11);
    return formatted;
}


function isValidPhone(phone) {
    const re = /^\(\d{2}\)\s\d{5}-\d{4}$/;
    return re.test(String(phone));
}


// Nova lógica para o valor da mensalidade com R$
function handleValorMensalidadeInput(event) {
    let value = event.target.value;
    // Remove o prefixo R$ e espaços para processamento
    let numericValue = value.replace(/R\$\s*/g, "");


    // Permite apenas números e uma vírgula
    numericValue = numericValue.replace(/[^\d,]/g, "");
   
    // Garante que haja apenas uma vírgula
    const parts = numericValue.split(",");
    if (parts.length > 2) {
        numericValue = parts[0] + "," + parts.slice(1).join("");
    }
    // Limita decimais a 2 dígitos após a vírgula
    if (parts[1] && parts[1].length > 2) {
        numericValue = parts[0] + "," + parts[1].substring(0, 2);
    }


    // Adiciona R$ de volta se houver algum valor numérico
    if (numericValue) {
        event.target.value = "R$ " + numericValue;
    } else {
        event.target.value = ""; // Limpa se não houver valor numérico
    }
}


function getValorMensalidadeEmCentavos(formattedValueWithPrefix) {
    if (!formattedValueWithPrefix) return 0;
    // Remove o prefixo R$ e espaços, depois processa como antes
    let valueStr = formattedValueWithPrefix.replace(/R\$\s*/g, "");
    valueStr = valueStr.replace(/[^\d,]/g, "");
    valueStr = valueStr.replace(",", ".");
   
    const valueFloat = parseFloat(valueStr);
    if (isNaN(valueFloat)) return 0;
   
    return Math.round(valueFloat * 100);
}




// --- Event Listeners para Máscaras ---
if (telefoneResponsavel) {
    telefoneResponsavel.addEventListener("input", (event) => {
        const formatted = formatPhone(event.target.value);
        event.target.value = formatted;
    });
    telefoneResponsavel.maxLength = 15;
}


if (valorMensalidadeInput) {
    valorMensalidadeInput.addEventListener("input", handleValorMensalidadeInput);
    valorMensalidadeInput.placeholder = "Ex: R$ 150 ou R$ 150,50";
    // Adiciona R$ ao focar se estiver vazio
    valorMensalidadeInput.addEventListener("focus", (event) => {
        if (!event.target.value) {
            event.target.value = "R$ ";
        }
    });
    // Remove R$ se o campo ficar apenas com R$ ao perder o foco
    valorMensalidadeInput.addEventListener("blur", (event) => {
        if (event.target.value.trim() === "R$") {
            event.target.value = "";
        }
    });
}


// --- Validação e Submissão do Formulário ---
if (formCadastroCrianca) {
    formCadastroCrianca.addEventListener("submit", async function(event) {
        event.preventDefault();
        let isValid = true;


        if (!nomeCrianca.value.trim()) {
            alert("Nome da criança é obrigatório."); isValid = false;
        }
        if (!nomeResponsavel.value.trim()) {
            alert("Nome do responsável é obrigatório."); isValid = false;
        }
        if (!telefoneResponsavel.value.trim()) {
            alert("Telefone do responsável é obrigatório."); isValid = false;
        } else if (!isValidPhone(telefoneResponsavel.value)) {
             alert("Formato de telefone inválido. Use (XX) XXXXX-XXXX."); isValid = false;
        }
        if (!horario.value) {
            alert("Selecione um horário."); isValid = false;
        }
        if (!escola.value.trim()) {
            alert("Nome da escola é obrigatório."); isValid = false;
        }
       
        const valorMensalidadeCentavos = getValorMensalidadeEmCentavos(valorMensalidadeInput.value);
        if (valorMensalidadeCentavos <= 0) {
            alert("Valor da mensalidade é obrigatório e deve ser maior que zero.");
            isValid = false;
        }


        const diaVenc = parseInt(dataVencimento.value, 10);
        if (!dataVencimento.value || isNaN(diaVenc) || diaVenc < 1 || diaVenc > 31) {
            alert("Dia do vencimento inválido (use 1-31)."); isValid = false;
        }


        if (!isValid) {
            console.log("Formulário de Cadastro de Criança inválido (client-side).");
            return;
        }


        console.log("Formulário válido. Enviando para API...");


        const formData = {
            nome_crianca: nomeCrianca.value.trim(),
            nome_responsavel: nomeResponsavel.value.trim(),
            telefone_responsavel: telefoneResponsavel.value.trim(),
            horario: horario.value,
            escola: escola.value.trim(),
            valor_mensalidade_centavos: valorMensalidadeCentavos,
            data_vencimento: diaVenc
        };
       
        console.log("Dados a serem enviados:", formData);


        try {
            const response = await fetch(`${API_BASE_URL}/cadastro_crianca.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const result = await response.json();


            if (response.ok && result.success) {
                alert("Criança cadastrada com sucesso!");
                formCadastroCrianca.reset();
                valorMensalidadeInput.value = ""; // Limpa o campo de valor explicitamente após reset
            } else {
                alert(result.message || "Erro ao cadastrar criança.");
            }
        } catch (error) {
            console.error("Erro na requisição:", error);
            alert("Erro de comunicação com o servidor.");
        }
    });
}