<?php
// api/dar_baixa.php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *"); // Ajustar em produção
header("Access-Control-Allow-Methods: POST"); 
header("Access-Control-Allow-Headers: Content-Type");

require_once "db_config.php"; // Assumindo que está na mesma pasta (api)

// Verifica se o método da requisição é POST
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405); // Método não permitido
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

// Determina o mês e ano de referência atuais
$mes_referencia = (int)date("n"); // Mês atual (1-12)
$ano_referencia = (int)date("Y"); // Ano atual (4 dígitos)

// Conecta ao banco de dados
$conn = new mysqli(DB_SERVER, DB_USERNAME, DB_PASSWORD, DB_NAME);

// Verifica a conexão
if ($conn->connect_error) {
    http_response_code(500);
    error_log("Erro de conexão com o banco de dados: " . $conn->connect_error);
    echo json_encode(["success" => false, "message" => "Erro interno do servidor [DB Connect]."]);
    exit;
}

// --- Lógica de Banco de Dados --- 

// 1. (Opcional, mas recomendado) Verificar se já existe pagamento para este mês/ano
$sql_check = "SELECT id FROM pagamentos WHERE aluno_id = ? AND mes_referencia = ? AND ano_referencia = ?";
$stmt_check = $conn->prepare($sql_check);
if ($stmt_check) {
    $stmt_check->bind_param("iii", $aluno_id, $mes_referencia, $ano_referencia);
    $stmt_check->execute();
    $stmt_check->store_result();
    if ($stmt_check->num_rows > 0) {
        http_response_code(409); // Conflict - Pagamento já registrado
        echo json_encode(["success" => false, "message" => "Pagamento para este mês já foi registrado anteriormente."]);
        $stmt_check->close();
        $conn->close();
        exit;
    }
    $stmt_check->close();
} else {
    // Logar erro na preparação, mas continuar (a inserção pode falhar depois)
    error_log("Erro ao preparar a query de verificação: " . $conn->error);
}

// 2. Inserir o registro de pagamento
$sql_insert = "INSERT INTO pagamentos (aluno_id, mes_referencia, ano_referencia) VALUES (?, ?, ?)";
$stmt_insert = $conn->prepare($sql_insert);

if ($stmt_insert === false) {
    http_response_code(500);
    error_log("Erro ao preparar a query de inserção: " . $conn->error);
    echo json_encode(["success" => false, "message" => "Erro interno do servidor [DB Prepare Insert]."]);
    $conn->close();
    exit;
}

$stmt_insert->bind_param("iii", $aluno_id, $mes_referencia, $ano_referencia);

// 3. Executar a inserção
if ($stmt_insert->execute()) {
    http_response_code(201); // Created
    echo json_encode(["success" => true, "message" => "Baixa de pagamento registrada com sucesso para {$mes_referencia}/{$ano_referencia}."]);
} else {
    http_response_code(500);
    error_log("Erro ao executar a query de inserção: " . $stmt_insert->error);
    echo json_encode(["success" => false, "message" => "Erro ao registrar baixa de pagamento no banco de dados."]);
}

// 4. Fechar statement e conexão
$stmt_insert->close();
$conn->close();

?>
