<?php
// api/get_alunos_desligados.php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");

require_once "db_config.php";

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Método não permitido."]);
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

// Query para buscar alunos INATIVOS
$sql_alunos = "SELECT id, nome_crianca, nome_responsavel, telefone_responsavel, horario, escola FROM criancas WHERE ativo = FALSE ORDER BY nome_crianca ASC";
$result_alunos = $conn->query($sql_alunos);

if ($result_alunos === false) {
    http_response_code(500);
    error_log("Erro ao executar a query de alunos desligados: " . $conn->error);
    echo json_encode(["success" => false, "message" => "Erro ao buscar alunos desligados."]);
    $conn->close();
    exit;
}

$alunos_desligados = [];

if ($result_alunos->num_rows > 0) {
    while($row = $result_alunos->fetch_assoc()) {
        $alunos_desligados[] = [
            "id" => $row["id"],
            "nome_crianca" => $row["nome_crianca"],
            "nome_responsavel" => $row["nome_responsavel"],
            "telefone_responsavel" => $row["telefone_responsavel"],
            "horario" => $row["horario"],
            "escola" => $row["escola"],
            "situacao" => "Desligado" // Adiciona a situação diretamente
        ];
    }
}

$result_alunos->close();
$conn->close();

http_response_code(200);
echo json_encode(["success" => true, "alunos" => $alunos_desligados]);

?>
