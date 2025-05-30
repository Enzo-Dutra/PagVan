<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *"); // Em desenvolvimento
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] == "OPTIONS") {
    exit(0);
}

require_once "db_config.php";

// Obter dados do corpo da requisição (JSON)
$data = json_decode(file_get_contents("php://input"), true);

$aluno_id = isset($data["aluno_id"]) ? intval($data["aluno_id"]) : 0;
$mes = isset($data["mes"]) ? intval($data["mes"]) : 0;
$ano = isset($data["ano"]) ? intval($data["ano"]) : 0;

// Validação básica
if ($aluno_id <= 0 || $mes < 1 || $mes > 12 || $ano <= 2000) { // Ano mínimo como exemplo
    echo json_encode(["success" => false, "message" => "Dados inválidos fornecidos."]);
    exit();
}

// Conectar ao banco
$conn = new mysqli(DB_SERVER, DB_USERNAME, DB_PASSWORD, DB_NAME);
if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Erro de conexão: " . $conn->connect_error]);
    exit();
}
$conn->set_charset("utf8mb4");

// Verificar se o pagamento já existe para evitar duplicatas
$sql_check = "SELECT id FROM pagamentos WHERE aluno_id = ? AND mes_referencia = ? AND ano_referencia = ?";
$stmt_check = $conn->prepare($sql_check);
if (!$stmt_check) {
    echo json_encode(["success" => false, "message" => "Erro ao preparar verificação: " . $conn->error]);
    $conn->close();
    exit();
}
$stmt_check->bind_param("iii", $aluno_id, $mes, $ano);
$stmt_check->execute();
$stmt_check->store_result();

if ($stmt_check->num_rows > 0) {
    $stmt_check->close();
    echo json_encode(["success" => false, "message" => "Pagamento para este mês já foi registrado."]);
    $conn->close();
    exit();
}
$stmt_check->close();

// Inserir o novo registro de pagamento
// Poderia adicionar valor_pago_centavos e registrado_por_id se necessário
$sql_insert = "INSERT INTO pagamentos (aluno_id, mes_referencia, ano_referencia, data_pagamento) VALUES (?, ?, ?, NOW())";
$stmt_insert = $conn->prepare($sql_insert);

if (!$stmt_insert) {
    echo json_encode(["success" => false, "message" => "Erro ao preparar inserção: " . $conn->error]);
    $conn->close();
    exit();
}

$stmt_insert->bind_param("iii", $aluno_id, $mes, $ano);

if ($stmt_insert->execute()) {
    if ($stmt_insert->affected_rows > 0) {
        echo json_encode(["success" => true, "message" => "Pagamento registrado com sucesso!"]);
    } else {
        echo json_encode(["success" => false, "message" => "Nenhuma linha afetada. Falha ao registrar pagamento."]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Erro ao executar inserção: " . $stmt_insert->error]);
}

$stmt_insert->close();
$conn->close();
?>

