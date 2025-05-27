<?php
// api/reativar_aluno.php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST"); // Usar POST para alteração de dados
header("Access-Control-Allow-Headers: Content-Type");

require_once "db_config.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Método não permitido."]);
    exit;
}

// Lê o corpo da requisição JSON
$input = json_decode(file_get_contents("php://input"), true);

// Valida o ID do aluno recebido
$aluno_id = isset($input["aluno_id"]) ? filter_var($input["aluno_id"], FILTER_VALIDATE_INT) : null;

if ($aluno_id === null || $aluno_id === false) {
    http_response_code(400); // Bad Request
    echo json_encode(["success" => false, "message" => "ID do aluno inválido ou não fornecido."]);
    exit;
}

$conn = new mysqli(DB_SERVER, DB_USERNAME, DB_PASSWORD, DB_NAME);

if ($conn->connect_error) {
    http_response_code(500);
    error_log("Erro de conexão com o banco de dados: " . $conn->connect_error);
    echo json_encode(["success" => false, "message" => "Erro interno do servidor [DB Connect]."]);
    exit;
}

$conn->set_charset("utf8mb4");

// Query para ATIVAR o aluno (definir ativo = TRUE)
$sql_update = "UPDATE criancas SET ativo = TRUE WHERE id = ?";

$stmt = $conn->prepare($sql_update);

if ($stmt === false) {
    http_response_code(500);
    error_log("Erro ao preparar a query de reativação: " . $conn->error);
    echo json_encode(["success" => false, "message" => "Erro interno do servidor [DB Prepare Update]."]);
    $conn->close();
    exit;
}

$stmt->bind_param("i", $aluno_id);

if ($stmt->execute()) {
    if ($stmt->affected_rows > 0) {
        http_response_code(200); // OK
        echo json_encode(["success" => true, "message" => "Aluno reativado com sucesso."]);
    } else {
        // Query executou, mas nenhuma linha foi afetada (talvez o aluno já estivesse ativo ou ID não existe)
        // Verificar se o aluno existe e já está ativo para uma mensagem mais precisa
        $sql_check_status = "SELECT ativo FROM criancas WHERE id = ?";
        $stmt_check = $conn->prepare($sql_check_status);
        $stmt_check->bind_param("i", $aluno_id);
        $stmt_check->execute();
        $result_check = $stmt_check->get_result();
        if ($result_check->num_rows > 0) {
            $row = $result_check->fetch_assoc();
            if ($row['ativo'] == TRUE) {
                http_response_code(200); // OK, mas informa que já estava ativo
                echo json_encode(["success" => true, "message" => "Aluno já estava ativo."]);
            } else {
                 // Isso não deveria acontecer se affected_rows foi 0 e o aluno existe e não estava ativo
                http_response_code(404); 
                echo json_encode(["success" => false, "message" => "Aluno não encontrado para reativação ou estado inesperado."]);
            }
        } else {
            http_response_code(404); // Not Found
            echo json_encode(["success" => false, "message" => "Aluno não encontrado."]);
        }
        $stmt_check->close();
    }
} else {
    http_response_code(500);
    error_log("Erro ao executar a query de reativação: " . $stmt->error);
    echo json_encode(["success" => false, "message" => "Erro ao reativar aluno no banco de dados."]);
}

$stmt->close();
$conn->close();

?>
