<?php
// api/update_aluno.php

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

// Valida o ID do aluno e os dados de atualização recebidos
$aluno_id = isset($input["id"]) ? filter_var($input["id"], FILTER_VALIDATE_INT) : null;
$updates = isset($input["updates"]) && is_array($input["updates"]) ? $input["updates"] : null;

if ($aluno_id === null || $aluno_id === false || $updates === null || empty($updates)) {
    http_response_code(400); // Bad Request
    echo json_encode(["success" => false, "message" => "Dados inválidos ou incompletos fornecidos."]);
    exit;
}

// Lista de campos permitidos para atualização para segurança
$allowed_fields = [
    "nome_crianca", 
    "nome_responsavel", 
    "telefone_responsavel", 
    "horario", 
    "escola", 
    "valor_mensalidade_centavos", 
    "dia_vencimento"
];

// Constrói a query de atualização dinamicamente
$set_clauses = [];
$bind_types = "";
$bind_values = [];

foreach ($updates as $field => $value) {
    if (in_array($field, $allowed_fields)) {
        $set_clauses[] = "`" . $field . "` = ?";
        
        // Determina o tipo para bind_param (i: integer, d: double, s: string)
        if ($field === "valor_mensalidade_centavos" || $field === "dia_vencimento") {
            $bind_types .= "i";
            $bind_values[] = filter_var($value, FILTER_VALIDATE_INT); // Garante que é inteiro
        } else {
            $bind_types .= "s";
            $bind_values[] = filter_var($value, FILTER_SANITIZE_STRING); // Limpa strings
        }
    } else {
        // Log ou ignora campos não permitidos
        error_log("Tentativa de atualizar campo não permitido: " . $field);
    }
}

if (empty($set_clauses)) {
    http_response_code(400); // Bad Request
    echo json_encode(["success" => false, "message" => "Nenhum campo válido para atualização fornecido."]);
    exit;
}

// Adiciona o ID do aluno ao final dos valores para o WHERE
$bind_types .= "i";
$bind_values[] = $aluno_id;

// Conecta ao banco de dados
$conn = new mysqli(DB_SERVER, DB_USERNAME, DB_PASSWORD, DB_NAME);

// Verifica a conexão
if ($conn->connect_error) {
    http_response_code(500);
    error_log("Erro de conexão com o banco de dados: " . $conn->connect_error);
    echo json_encode(["success" => false, "message" => "Erro interno do servidor [DB Connect]."]);
    exit;
}

// Monta a query final
$sql = "UPDATE criancas SET " . implode(", ", $set_clauses) . " WHERE id = ?";

$stmt = $conn->prepare($sql);

if ($stmt === false) {
    http_response_code(500);
    error_log("Erro ao preparar a query de atualização: " . $conn->error . " SQL: " . $sql);
    echo json_encode(["success" => false, "message" => "Erro interno do servidor [DB Prepare Update]."]);
    $conn->close();
    exit;
}

// Faz o bind dos parâmetros dinamicamente
// O operador ... (splat) desempacota o array $bind_values
$stmt->bind_param($bind_types, ...$bind_values);

// Executa a atualização
if ($stmt->execute()) {
    if ($stmt->affected_rows > 0) {
        http_response_code(200); // OK
        echo json_encode(["success" => true, "message" => "Dados do aluno atualizados com sucesso."]);
    } else {
        // Query executou, mas nenhuma linha foi afetada (talvez os dados já fossem os mesmos)
        http_response_code(200); // OK, mas informa que nada mudou
        echo json_encode(["success" => true, "message" => "Nenhuma alteração necessária nos dados."]);
    }
} else {
    http_response_code(500);
    error_log("Erro ao executar a query de atualização: " . $stmt->error);
    echo json_encode(["success" => false, "message" => "Erro ao atualizar dados do aluno no banco de dados."]);
}

// Fecha o statement e a conexão
$stmt->close();
$conn->close();

?>
