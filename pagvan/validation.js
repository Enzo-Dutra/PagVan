// Arquivo para validação, máscaras e comunicação com API PagVan

console.log("validation.js carregado.");

// --- Constantes ---
const API_BASE_URL = "./api"; // Assume que a pasta 'api' está no mesmo nível que os HTML

// --- Elementos do DOM ---
const formLogin = document.getElementById("form-login");
const emailLogin = document.getElementById("email-login");
const senhaLogin = document.getElementById("senha-login");

const formCadastro = document.getElementById("form-cadastro");
const nomeCadastro = document.getElementById("nome-cadastro");
const emailCadastro = document.getElementById("email-cadastro");
const telefoneCadastro = document.getElementById("telefone-cadastro");
const cpfCadastro = document.getElementById("cpf-cadastro");
const senhaCadastro = document.getElementById("senha-cadastro");
const confirmaSenhaCadastro = document.getElementById("confirma-senha-cadastro");

// --- Funções Auxiliares ---

// Mostra mensagem de erro
function showError(inputElement, message) {
    const errorSpan = document.getElementById(`${inputElement.id}-error`);
    if (errorSpan) {
        errorSpan.textContent = message;
        inputElement.classList.add("input-error");
        errorSpan.style.display = "block"; // Garante que a mensagem seja visível
    }
}

// Limpa mensagem de erro
function clearError(inputElement) {
    const errorSpan = document.getElementById(`${inputElement.id}-error`);
    if (errorSpan) {
        errorSpan.textContent = "";
        inputElement.classList.remove("input-error");
        errorSpan.style.display = "none"; // Esconde o espaço da mensagem
    }
}

// Mostra mensagem de sucesso ou feedback geral do formulário
function showFormFeedback(formElement, message, isSuccess = true) {
    let feedbackDiv = formElement.querySelector(".form-feedback");
    if (!feedbackDiv) {
        feedbackDiv = document.createElement("div");
        feedbackDiv.className = "form-feedback";
        const firstFormGroup = formElement.querySelector(".form-group");
        if (firstFormGroup) {
            formElement.insertBefore(feedbackDiv, firstFormGroup);
        } else {
            const submitButton = formElement.querySelector("button[type=\"submit\"]");
            if (submitButton) {
                 formElement.insertBefore(feedbackDiv, submitButton);
            }
        }
    }
    feedbackDiv.textContent = message;
    feedbackDiv.className = `form-feedback ${isSuccess ? "success" : "error"}`;
    feedbackDiv.style.display = "block";
}

// Limpa feedback geral do formulário
function clearFormFeedback(formElement) {
    const feedbackDiv = formElement.querySelector(".form-feedback");
    if (feedbackDiv) {
        feedbackDiv.textContent = "";
        feedbackDiv.style.display = "none";
    }
}

// --- Funções de Validação ---
function isValidEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

function isValidPhone(phone) {
    const re = /^\(\d{2}\)\s\d{5}-\d{4}$/;
    return re.test(String(phone));
}

function isValidCPF(cpf) {
    const re = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
    return re.test(String(cpf));
}

// --- Funções de Máscara ---

function formatPhone(value) {
    // Remove tudo que não for dígito
    const digits = value.replace(/\D/g, "");

    // Aplica a máscara (XX) XXXXX-XXXX
    let formatted = "";
    if (digits.length > 0) {
        formatted = "(" + digits.substring(0, 2);
    }
    if (digits.length > 2) {
        formatted += ") " + digits.substring(2, 7);
    }
    if (digits.length > 7) {
        formatted += "-" + digits.substring(7, 11);
    }
    return formatted;
}

function formatCPF(value) {
    // Remove tudo que não for dígito
    const digits = value.replace(/\D/g, "");

    // Aplica a máscara XXX.XXX.XXX-XX
    let formatted = "";
    if (digits.length > 0) {
        formatted = digits.substring(0, 3);
    }
    if (digits.length > 3) {
        formatted += "." + digits.substring(3, 6);
    }
    if (digits.length > 6) {
        formatted += "." + digits.substring(6, 9);
    }
    if (digits.length > 9) {
        formatted += "-" + digits.substring(9, 11);
    }
    return formatted;
}

// --- Event Listeners para Máscaras ---

if (telefoneCadastro) {
    telefoneCadastro.addEventListener("input", (event) => {
        // Limita o tamanho e aplica a máscara
        const formatted = formatPhone(event.target.value);
        event.target.value = formatted;
    });
    // Define o tamanho máximo do input para o tamanho da máscara
    telefoneCadastro.maxLength = 15; // (XX) XXXXX-XXXX
}

if (cpfCadastro) {
    cpfCadastro.addEventListener("input", (event) => {
        // Limita o tamanho e aplica a máscara
        const formatted = formatCPF(event.target.value);
        event.target.value = formatted;
    });
    // Define o tamanho máximo do input para o tamanho da máscara
    cpfCadastro.maxLength = 14; // XXX.XXX.XXX-XX
}

// --- Validação e Submissão Formulário de Login ---
if (formLogin) {
    formLogin.addEventListener("submit", async function(event) {
        event.preventDefault();
        clearFormFeedback(formLogin);
        let isValid = true;
        clearError(emailLogin);
        clearError(senhaLogin);

        if (!emailLogin.value.trim()) {
            showError(emailLogin, "O campo Email é obrigatório.");
            isValid = false;
        } else if (!isValidEmail(emailLogin.value)) {
            showError(emailLogin, "Por favor, insira um email válido.");
            isValid = false;
        }
        if (!senhaLogin.value.trim()) {
            showError(senhaLogin, "O campo Senha é obrigatório.");
            isValid = false;
        }

        if (!isValid) {
            console.log("Formulário de Login inválido (client-side).");
            return;
        }
        console.log("Formulário de Login válido (client-side). Enviando para API...");
        const formData = { email: emailLogin.value.trim(), password: senhaLogin.value };

        try {
            const response = await fetch(`${API_BASE_URL}/login.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const result = await response.json();
            if (response.ok && result.success) {
                console.log("Login bem-sucedido, redirecionando...");
                // Redireciona PRIMEIRO para a página de boas-vindas
                window.location.href = "bem_vindo.html"; 
                // A linha abaixo provavelmente não será executada ou vista pelo usuário
                // showFormFeedback(formLogin, result.message, true);
            } else {
                showFormFeedback(formLogin, result.message || "Erro ao fazer login.", false);
                console.error("Erro no login:", result);
            }
        } catch (error) {
            console.error("Erro na requisição de login:", error);
            showFormFeedback(formLogin, "Erro de comunicação com o servidor. Tente novamente.", false);
        }
    });
}

// --- Validação e Submissão Formulário de Cadastro ---
if (formCadastro) {
    formCadastro.addEventListener("submit", async function(event) {
        event.preventDefault();
        clearFormFeedback(formCadastro);
        let isValid = true;

        clearError(nomeCadastro);
        clearError(emailCadastro);
        clearError(telefoneCadastro);
        clearError(cpfCadastro);
        clearError(senhaCadastro);
        clearError(confirmaSenhaCadastro);

        if (!nomeCadastro.value.trim()) {
            showError(nomeCadastro, "O campo Nome Completo é obrigatório.");
            isValid = false;
        }
        if (!emailCadastro.value.trim()) {
            showError(emailCadastro, "O campo Email é obrigatório.");
            isValid = false;
        } else if (!isValidEmail(emailCadastro.value)) {
            showError(emailCadastro, "Por favor, insira um email válido.");
            isValid = false;
        }
        // Valida o telefone JÁ FORMATADO
        if (!telefoneCadastro.value.trim()) {
            showError(telefoneCadastro, "O campo Telefone é obrigatório.");
            isValid = false;
        } else if (!isValidPhone(telefoneCadastro.value)) { // A validação espera o formato com máscara
            showError(telefoneCadastro, "Formato inválido. Use (XX) XXXXX-XXXX.");
            isValid = false;
        }
        if (!cpfCadastro.value.trim()) {
            showError(cpfCadastro, "O campo CPF é obrigatório.");
            isValid = false;
        } else if (!isValidCPF(cpfCadastro.value)) {
            showError(cpfCadastro, "Formato inválido. Use XXX.XXX.XXX-XX.");
            isValid = false;
        }
        if (!senhaCadastro.value.trim()) {
            showError(senhaCadastro, "O campo Senha é obrigatório.");
            isValid = false;
        } else if (senhaCadastro.value.length < 6) {
            showError(senhaCadastro, "A senha deve ter no mínimo 6 caracteres.");
            isValid = false;
        }
        if (!confirmaSenhaCadastro.value.trim()) {
            showError(confirmaSenhaCadastro, "O campo Confirme sua Senha é obrigatório.");
            isValid = false;
        } else if (senhaCadastro.value !== confirmaSenhaCadastro.value) {
            showError(confirmaSenhaCadastro, "As senhas não coincidem.");
            isValid = false;
        }

        if (!isValid) {
            console.log("Formulário de Cadastro inválido (client-side).");
            return;
        }
        console.log("Formulário de Cadastro válido (client-side). Enviando para API...");

        const formData = {
            nome: nomeCadastro.value.trim(),
            email: emailCadastro.value.trim(),
            telefone: telefoneCadastro.value.trim(), // Envia o valor formatado
            cpf: cpfCadastro.value.trim(),
            password: senhaCadastro.value,
            confirm_password: confirmaSenhaCadastro.value
        };

        try {
            const response = await fetch(`${API_BASE_URL}/cadastro.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const result = await response.json();
            if (response.ok && result.success) {
                showFormFeedback(formCadastro, result.message, true);
                console.log("Cadastro bem-sucedido:", result);
                formCadastro.reset();
                alert("Cadastro realizado com sucesso! Você já pode fazer login.");
            } else {
                showFormFeedback(formCadastro, result.message || "Erro ao cadastrar.", false);
                console.error("Erro no cadastro:", result);
            }
        } catch (error) {
            console.error("Erro na requisição de cadastro:", error);
            showFormFeedback(formCadastro, "Erro de comunicação com o servidor. Tente novamente.", false);
        }
    });
}

// Adiciona estilos para feedback do formulário
const style = document.createElement("style");
style.textContent = `
    .form-feedback {
        padding: 10px;
        margin-bottom: 15px;
        border-radius: 4px;
        text-align: center;
        font-weight: bold;
        display: none;
    }
    .form-feedback.success {
        background-color: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
    }
    .form-feedback.error {
        background-color: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
    }
    .error-message {
        display: none;
    }
`;
document.head.appendChild(style);

console.log("Listeners de validação, máscaras e submissão AJAX adicionados.");
