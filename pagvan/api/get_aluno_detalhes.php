<?php
// api/get_aluno_detalhes.php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *"); // Ajustar em produção
header("Access-Control-Allow-Methods: GET");

require_once "db_config.php"; // Assumindo que está na mesma pasta (api)

// Verifica se o método da requisição é GET
if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405); // Método não permitido
    echo json_encode(["success" => false, "message" => "Método não permitido."]);
    exit;
}

// Valida o ID do aluno recebido via GET
$aluno_id = isset($_GET["id"]) ? filter_var($_GET["id"], FILTER_VALIDATE_INT) : null;

if ($aluno_id === null || $aluno_id === false) {
    http_response_code(400); // Bad Request
    echo json_encode(["success" => false, "message" => "ID do aluno inválido ou não fornecido."]);
    exit;
}

// Conecta ao banco de dados
$conn = new mysqli(DB_SERVER, DB_USERNAME, DB_PASSWORD, DB_NAME);

// Verifica a conexão
if ($conn->connect_error) {
    http_response_code(500);
    error_log("Erro de conexão com o banco de dados: " . $conn->connect_error);
    echo json_encode(["success" => false, "message" => "Erro interno do servidor [DB Connect]."]);
    exit;
}

// Query para buscar detalhes do aluno específico
$sql = "SELECT id, nome_crianca, nome_responsavel, telefone_responsavel, horario, escola, valor_mensalidade_centavos, dia_vencimento, ativo 
        FROM criancas 
        WHERE id = ? AND ativo = TRUE"; // Busca apenas alunos ativos

$stmt = $conn->prepare($sql);

if ($stmt === false) {
    http_response_code(500);
    error_log("Erro ao preparar a query: " . $conn->error);
    echo json_encode(["success" => false, "message" => "Erro interno do servidor [DB Prepare]."]);
    $conn->close();
    exit;
}

$stmt->bind_param("i", $aluno_id);

if (!$stmt->execute()) {
    http_response_code(500);
    error_log("Erro ao executar a query: " . $stmt->error);
    echo json_encode(["success" => false, "message" => "Erro ao buscar detalhes do aluno."]);
    $stmt->close();
    $conn->close();
    exit;
}

$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $aluno = $result->fetch_assoc();
    // Formatar valor da mensalidade para exibição (R$ X.XXX,XX)
    $aluno["valor_mensalidade_formatado"] = "R$ " . number_format($aluno["valor_mensalidade_centavos"] / 100, 2, ',', '.');
    
    http_response_code(200);
    echo json_encode(["success" => true, "aluno" => $aluno]);
} else {
    http_response_code(404); // Not Found
    echo json_encode(["success" => false, "message" => "Aluno não encontrado ou inativo."]);
}

// Fecha o statement e a conexão
$stmt->close();
$conn->close();

?>
