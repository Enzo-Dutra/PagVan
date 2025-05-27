<?php
// api/get_alunos.php

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

// Conecta ao banco de dados
$conn = new mysqli(DB_SERVER, DB_USERNAME, DB_PASSWORD, DB_NAME);

// Verifica a conexão
if ($conn->connect_error) {
    http_response_code(500);
    error_log("Erro de conexão com o banco de dados: " . $conn->connect_error);
    echo json_encode(["success" => false, "message" => "Erro interno do servidor [DB Connect]."]);
    exit;
}

// Prepara a query para verificar pagamentos (será reutilizada no loop)
$sql_check_pagamento = "SELECT id FROM pagamentos WHERE aluno_id = ? AND mes_referencia = ? AND ano_referencia = ? LIMIT 1";
$stmt_check = $conn->prepare($sql_check_pagamento);
if ($stmt_check === false) {
    http_response_code(500);
    error_log("Erro ao preparar a query de verificação de pagamento: " . $conn->error);
    echo json_encode(["success" => false, "message" => "Erro interno do servidor [DB Prepare Check]."]);
    $conn->close();
    exit;
}

// Query para buscar alunos ativos
$sql_alunos = "SELECT id, nome_crianca, dia_vencimento FROM criancas WHERE ativo = TRUE ORDER BY nome_crianca ASC";
$result_alunos = $conn->query($sql_alunos);

if ($result_alunos === false) {
    http_response_code(500);
    error_log("Erro ao executar a query de alunos: " . $conn->error);
    echo json_encode(["success" => false, "message" => "Erro ao buscar alunos."]);
    $stmt_check->close();
    $conn->close();
    exit;
}

$alunos = [];
$hoje = (int)date("j"); // Dia atual do mês (1-31)
$mes_atual = (int)date("n"); // Mês atual (1-12)
$ano_atual = (int)date("Y"); // Ano atual (4 dígitos)

if ($result_alunos->num_rows > 0) {
    while($row = $result_alunos->fetch_assoc()) {
        $aluno_id = $row["id"];
        $dia_vencimento = (int)$row["dia_vencimento"];
        $situacao = "";
        $situacao_classe = "";

        // 1. Verifica se já existe pagamento para o mês/ano atual
        $stmt_check->bind_param("iii", $aluno_id, $mes_atual, $ano_atual);
        $stmt_check->execute();
        $stmt_check->store_result();
        $pagamento_existe = $stmt_check->num_rows > 0;

        if ($pagamento_existe) {
            // Se já pagou este mês, está em dia
            $situacao = "Em dia";
            $situacao_classe = "status-em-dia";
        } else {
            // Se não pagou, verifica a data de vencimento
            $diferenca_dias = $dia_vencimento - $hoje;

            if ($diferenca_dias < 0) {
                // Venceu em dias anteriores neste mês e não pagou
                $situacao = "Atrasada";
                $situacao_classe = "status-atrasado";
            } elseif ($diferenca_dias >= 0 && $diferenca_dias <= 5) {
                // Vence hoje ou nos próximos 5 dias e não pagou
                $situacao = "Prestes à vencer";
                $situacao_classe = "status-prestes-a-vencer";
            } else {
                // Vence depois (ou já venceu no mês anterior - simplificado) e não pagou
                $situacao = "Em dia"; // Considera "Em dia" se ainda não venceu no mês
                $situacao_classe = "status-em-dia";
            }
        }

        $alunos[] = [
            "id" => $aluno_id,
            "nome" => $row["nome_crianca"],
            "vencimento_dia" => $dia_vencimento,
            "vencimento_texto" => "Dia " . $dia_vencimento,
            "situacao" => $situacao,
            "situacao_classe" => $situacao_classe
        ];
    }
}

// Fecha statements e conexão
$stmt_check->close();
$result_alunos->close(); // Fecha o result set dos alunos
$conn->close();

// Retorna os dados como JSON
http_response_code(200);
echo json_encode(["success" => true, "alunos" => $alunos]);

?>
