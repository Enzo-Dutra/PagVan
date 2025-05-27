<?php
// api/cadastro.php

header("Content-Type: application/json"); // Define o tipo de conteúdo da resposta como JSON
header("Access-Control-Allow-Origin: *"); // Permite requisições de qualquer origem (ajuste em produção)
header("Access-Control-Allow-Methods: POST"); // Permite apenas o método POST
header("Access-Control-Allow-Headers: Content-Type"); // Permite o header Content-Type

// Inclui o arquivo de configuração do banco de dados
require_once "db_config.php"; // Assume que db_config.php está no diretório pai

// Verifica se o método da requisição é POST
if ($_SERVER["REQUEST_METHOD"] == "POST") {

    // Obtém os dados JSON enviados no corpo da requisição
    $input = json_decode(file_get_contents("php://input"), true);

    // Validação básica dos dados recebidos (complementar à validação JS)
    $nome = $input["nome"] ?? null;
    $email = $input["email"] ?? null;
    $telefone = $input["telefone"] ?? null;
    $cpf = $input["cpf"] ?? null;
    $senha = $input["password"] ?? null;
    $confirma_senha = $input["confirm_password"] ?? null;

    // Verifica campos obrigatórios
    if (empty($nome) || empty($email) || empty($senha) || empty($confirma_senha) || empty($cpf) || empty($telefone)) {
        http_response_code(400); // Bad Request
        echo json_encode(["success" => false, "message" => "Todos os campos obrigatórios devem ser preenchidos."]);
        exit;
    }

    // Valida formato do email no servidor
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Formato de email inválido."]);
        exit;
    }

    // Valida se as senhas coincidem
    if ($senha !== $confirma_senha) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "As senhas não coincidem."]);
        exit;
    }

    // Valida tamanho mínimo da senha
    if (strlen($senha) < 6) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "A senha deve ter no mínimo 6 caracteres."]);
        exit;
    }

    // Verifica se o email ou CPF já existem
    $sql_check = "SELECT id FROM usuarios WHERE email = ? OR cpf = ?";
    if ($stmt_check = mysqli_prepare($link, $sql_check)) {
        mysqli_stmt_bind_param($stmt_check, "ss", $param_email_check, $param_cpf_check);
        $param_email_check = $email;
        $param_cpf_check = $cpf;

        if (mysqli_stmt_execute($stmt_check)) {
            mysqli_stmt_store_result($stmt_check);
            if (mysqli_stmt_num_rows($stmt_check) > 0) {
                http_response_code(409); // Conflict
                echo json_encode(["success" => false, "message" => "Email ou CPF já cadastrado."]);
                mysqli_stmt_close($stmt_check);
                mysqli_close($link);
                exit;
            }
        } else {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Erro ao verificar usuário existente."]);
            mysqli_stmt_close($stmt_check);
            mysqli_close($link);
            exit;
        }
        mysqli_stmt_close($stmt_check);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Erro ao preparar a verificação de usuário."]);
        mysqli_close($link);
        exit;
    }

    // Cria o hash da senha
    $senha_hash = password_hash($senha, PASSWORD_DEFAULT);

    // Prepara a query de inserção
    $sql_insert = "INSERT INTO usuarios (nome, email, telefone, cpf, senha_hash) VALUES (?, ?, ?, ?, ?)";

    if ($stmt_insert = mysqli_prepare($link, $sql_insert)) {
        // Vincula as variáveis aos parâmetros da query preparada
        mysqli_stmt_bind_param($stmt_insert, "sssss", $param_nome, $param_email, $param_telefone, $param_cpf, $param_senha_hash);

        // Define os parâmetros
        $param_nome = $nome;
        $param_email = $email;
        $param_telefone = $telefone;
        $param_cpf = $cpf;
        $param_senha_hash = $senha_hash;

        // Tenta executar a query preparada
        if (mysqli_stmt_execute($stmt_insert)) {
            http_response_code(201); // Created
            echo json_encode(["success" => true, "message" => "Usuário cadastrado com sucesso!"]);
        } else {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Erro ao cadastrar usuário: " . mysqli_error($link)]);
        }

        // Fecha o statement
        mysqli_stmt_close($stmt_insert);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Erro ao preparar a inserção: " . mysqli_error($link)]);
    }

    // Fecha a conexão
    mysqli_close($link);

} else {
    // Se o método não for POST
    http_response_code(405); // Method Not Allowed
    echo json_encode(["success" => false, "message" => "Método não permitido."]);
}
?>
