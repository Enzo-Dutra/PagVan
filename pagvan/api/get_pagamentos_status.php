<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *"); // Em desenvolvimento, para testes locais
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Lida com requisições OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

require_once "db_config.php";

// --- Obter Parâmetros ---
$aluno_id = isset($_GET['id']) ? intval($_GET['id']) : 0;
$ano_referencia = isset($_GET['ano']) ? intval($_GET['ano']) : date('Y'); // Ano atual como padrão

if ($aluno_id <= 0) {
    echo json_encode(["success" => false, "message" => "ID do aluno inválido."]);
    exit();
}

// --- Conectar ao Banco ---
$conn = new mysqli(DB_SERVER, DB_USERNAME, DB_PASSWORD, DB_NAME);
if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Erro de conexão: " . $conn->connect_error]);
    exit();
}
$conn->set_charset("utf8mb4");

// --- Buscar Dados do Aluno (Nome e Dia de Vencimento) ---
$dia_vencimento = null;
$nome_aluno = "Aluno não encontrado";
$sql_aluno = "SELECT nome_crianca, dia_vencimento FROM criancas WHERE id = ? AND ativo = TRUE";
$stmt_aluno = $conn->prepare($sql_aluno);
if ($stmt_aluno) {
    $stmt_aluno->bind_param("i", $aluno_id);
    if ($stmt_aluno->execute()) {
        $result_aluno = $stmt_aluno->get_result();
        if ($row_aluno = $result_aluno->fetch_assoc()) {
            $dia_vencimento = $row_aluno['dia_vencimento'];
            $nome_aluno = $row_aluno['nome_crianca'];
        } else {
             echo json_encode(["success" => false, "message" => "Aluno não encontrado ou inativo."]);
             $stmt_aluno->close();
             $conn->close();
             exit();
        }
    } else {
        // Log de erro seria útil aqui
    }
    $stmt_aluno->close();
} else {
     echo json_encode(["success" => false, "message" => "Erro ao preparar consulta do aluno: " . $conn->error]);
     $conn->close();
     exit();
}

if ($dia_vencimento === null) {
    echo json_encode(["success" => false, "message" => "Não foi possível obter o dia de vencimento do aluno."]);
    $conn->close();
    exit();
}

// --- Buscar Pagamentos Existentes para o Ano ---
$pagamentos_feitos = [];
$sql_pagamentos = "SELECT mes_referencia FROM pagamentos WHERE aluno_id = ? AND ano_referencia = ?";
$stmt_pagamentos = $conn->prepare($sql_pagamentos);
if ($stmt_pagamentos) {
    $stmt_pagamentos->bind_param("ii", $aluno_id, $ano_referencia);
    if ($stmt_pagamentos->execute()) {
        $result_pagamentos = $stmt_pagamentos->get_result();
        while ($row_pagamento = $result_pagamentos->fetch_assoc()) {
            $pagamentos_feitos[] = $row_pagamento['mes_referencia'];
        }
    }
    $stmt_pagamentos->close();
} else {
    // Log de erro seria útil
}

// --- Determinar Status para Cada Mês ---
$status_mensal = [];
$meses_nomes = [
    1 => "Janeiro", 2 => "Fevereiro", 3 => "Março", 4 => "Abril", 
    5 => "Maio", 6 => "Junho", 7 => "Julho", 8 => "Agosto", 
    9 => "Setembro", 10 => "Outubro", 11 => "Novembro", 12 => "Dezembro"
];

$hoje = new DateTimeImmutable(); // Data atual

for ($mes = 1; $mes <= 12; $mes++) {
    $status = "";
    $classe_css = "";

    if (in_array($mes, $pagamentos_feitos)) {
        $status = "Pago";
        $classe_css = "status-pago";
    } else {
        // Calcular data de vencimento para o mês/ano
        // Garante que o dia seja válido para o mês (ex: dia 31 em fevereiro)
        $ultimo_dia_mes = date('t', mktime(0, 0, 0, $mes, 1, $ano_referencia));
        $dia_venc_ajustado = min($dia_vencimento, $ultimo_dia_mes);
        
        try {
            // Cria a data de vencimento no formato Y-m-d H:i:s para comparação segura
            // Considera o final do dia do vencimento
            $data_vencimento_obj = new DateTimeImmutable(sprintf('%d-%02d-%02d 23:59:59', $ano_referencia, $mes, $dia_venc_ajustado));
            
            if ($hoje > $data_vencimento_obj) {
                $status = "Atrasado";
                $classe_css = "status-atrasado";
            } else {
                $status = "Pendente";
                $classe_css = "status-pendente";
            }
        } catch (Exception $e) {
            // Em caso de erro na criação da data (improvável com a validação acima)
            $status = "Erro Data";
            $classe_css = "status-erro";
        }
    }

    $status_mensal[] = [
        "mes_numero" => $mes,
        "mes_nome" => $meses_nomes[$mes],
        "status" => $status,
        "classe_css" => $classe_css
    ];
}

// --- Retornar Resultado ---
echo json_encode([
    "success" => true, 
    "aluno_id" => $aluno_id,
    "nome_aluno" => $nome_aluno,
    "ano_referencia" => $ano_referencia,
    "pagamentos" => $status_mensal
]);

$conn->close();
?>

