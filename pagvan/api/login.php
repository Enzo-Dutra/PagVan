<?php
// api/login.php

session_start(); // Inicia a sessão para gerenciamento de login (opcional, mas comum)

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *"); // Ajuste em produção
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

require_once "db_config.php"; // Assume que db_config.php está no diretório pai

if ($_SERVER["REQUEST_METHOD"] == "POST") {

    $input = json_decode(file_get_contents("php://input"), true);

    $email = $input["email"] ?? null;
    $senha = $input["password"] ?? null;

    // Validação básica
    if (empty($email) || empty($senha)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Email e senha são obrigatórios."]);
        exit;
    }

    // Prepara a query para buscar o usuário pelo email
    $sql = "SELECT id, nome, email, senha_hash FROM usuarios WHERE email = ?";

    if ($stmt = mysqli_prepare($link, $sql)) {
        mysqli_stmt_bind_param($stmt, "s", $param_email);
        $param_email = $email;

        if (mysqli_stmt_execute($stmt)) {
            mysqli_stmt_store_result($stmt);

            // Verifica se o usuário existe
            if (mysqli_stmt_num_rows($stmt) == 1) {
                mysqli_stmt_bind_result($stmt, $id, $nome, $db_email, $senha_hash);
                if (mysqli_stmt_fetch($stmt)) {
                    // Verifica a senha
                    if (password_verify($senha, $senha_hash)) {
                        // Senha correta - Login bem-sucedido
                        // Opcional: Iniciar sessão e armazenar dados do usuário
                        // session_regenerate_id(); // Regenera ID da sessão por segurança
                        // $_SESSION["loggedin"] = true;
                        // $_SESSION["id"] = $id;
                        // $_SESSION["nome"] = $nome;
                        // $_SESSION["email"] = $db_email;

                        http_response_code(200); // OK
                        echo json_encode([
                            "success" => true,
                            "message" => "Login bem-sucedido!",
                            "user" => [ // Opcional: retornar alguns dados do usuário
                                "id" => $id,
                                "nome" => $nome,
                                "email" => $db_email
                            ]
                        ]);
                    } else {
                        // Senha incorreta
                        http_response_code(401); // Unauthorized
                        echo json_encode(["success" => false, "message" => "Email ou senha inválidos."]);
                    }
                }
            } else {
                // Usuário não encontrado
                http_response_code(401); // Unauthorized
                echo json_encode(["success" => false, "message" => "Email ou senha inválidos."]);
            }
        } else {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Erro ao executar a busca pelo usuário."]);
        }
        mysqli_stmt_close($stmt);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Erro ao preparar a busca pelo usuário."]);
    }

    mysqli_close($link);

} else {
    http_response_code(405); // Method Not Allowed
    echo json_encode(["success" => false, "message" => "Método não permitido."]);
}
?>
