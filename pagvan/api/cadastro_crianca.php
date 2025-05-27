<?php
// api/cadastro_crianca.php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *"); // Permitir acesso de qualquer origem (ajustar em produção)
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

// Inclui o arquivo de configuração do banco de dados
// Assumindo que db_config.php está na mesma pasta (api)
require_once "db_config.php";

// Verifica se o método da requisição é POST
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405); // Método não permitido
    echo json_encode(["success" => false, "message" => "Método não permitido."]);
    exit;
}

// Lê o corpo da requisição JSON
$input = json_decode(file_get_contents("php://input"), true);

// Validação básica dos dados recebidos (essencial no backend!)
$errors = [];
if (empty($input["nome_crianca"])) $errors[] = "Nome da criança é obrigatório.";
if (empty($input["nome_responsavel"])) $errors[] = "Nome do responsável é obrigatório.";
if (empty($input["telefone_responsavel"])) {
    $errors[] = "Telefone do responsável é obrigatório.";
} elseif (!preg_match("/^\(\d{2}\)\s\d{5}-\d{4}$/", $input["telefone_responsavel"])) {
    $errors[] = "Formato de telefone inválido.";
}
if (empty($input["horario"]) || !in_array($input["horario"], ["Manhã", "Tarde", "Integral"])) {
    $errors[] = "Horário inválido.";
}
if (empty($input["escola"])) $errors[] = "Nome da escola é obrigatório.";
if (!isset($input["valor_mensalidade_centavos"]) || !is_numeric($input["valor_mensalidade_centavos"]) || $input["valor_mensalidade_centavos"] < 0) {
    $errors[] = "Valor da mensalidade inválido.";
}
if (empty($input["data_vencimento"]) || !filter_var($input["data_vencimento"], FILTER_VALIDATE_INT, ["options" => ["min_range" => 1, "max_range" => 31]])) {
    $errors[] = "Dia do vencimento inválido (1-31).";
}

if (!empty($errors)) {
    http_response_code(400); // Bad Request
    echo json_encode(["success" => false, "message" => implode(" ", $errors)]);
    exit;
}

// Conecta ao banco de dados
$conn = new mysqli(DB_SERVER, DB_USERNAME, DB_PASSWORD, DB_NAME);

// Verifica a conexão
if ($conn->connect_error) {
    http_response_code(500); // Internal Server Error
    // Não exponha detalhes do erro em produção
    error_log("Erro de conexão com o banco de dados: " . $conn->connect_error);
    echo json_encode(["success" => false, "message" => "Erro interno do servidor [DB Connect]."]);
    exit;
}

// Prepara a query SQL para inserção
$sql = "INSERT INTO criancas (nome_crianca, nome_responsavel, telefone_responsavel, horario, escola, valor_mensalidade_centavos, dia_vencimento) VALUES (?, ?, ?, ?, ?, ?, ?)";

$stmt = $conn->prepare($sql);

if ($stmt === false) {
    http_response_code(500);
    error_log("Erro ao preparar a query: " . $conn->error);
    echo json_encode(["success" => false, "message" => "Erro interno do servidor [DB Prepare]."]);
    $conn->close();
    exit;
}

// Associa os parâmetros (bind)
// Tipos: s = string, i = integer, d = double, b = blob
$stmt->bind_param("sssssii", 
    $input["nome_crianca"],
    $input["nome_responsavel"],
    $input["telefone_responsavel"],
    $input["horario"],
    $input["escola"],
    $input["valor_mensalidade_centavos"],
    $input["data_vencimento"]
);

// Executa a query
if ($stmt->execute()) {
    http_response_code(201); // Created
    echo json_encode(["success" => true, "message" => "Criança cadastrada com sucesso!", "id" => $stmt->insert_id]);
} else {
    http_response_code(500);
    error_log("Erro ao executar a query: " . $stmt->error);
    // Verificar se é erro de duplicidade, etc., para mensagens mais específicas
    echo json_encode(["success" => false, "message" => "Erro ao cadastrar criança no banco de dados."]);
}

// Fecha o statement e a conexão
$stmt->close();
$conn->close();

?>
