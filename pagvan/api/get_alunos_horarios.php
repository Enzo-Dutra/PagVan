<?php
header("Content-Type: application/json");

require_once "db_config.php";

// Obter filtros (se enviados)
$filtro_escola = isset($_GET["escola"]) ? trim($_GET["escola"]) : "";
$filtro_horario = isset($_GET["horario"]) ? trim($_GET["horario"]) : "";

$alunos = [];

// Conectar ao banco de dados
$conn = new mysqli(DB_SERVER, DB_USERNAME, DB_PASSWORD, DB_NAME);

// Verificar conexão
if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Erro de conexão com o banco de dados: " . $conn->connect_error]);
    exit();
}

// Definir charset para UTF-8
$conn->set_charset("utf8mb4");

// Construir a query SQL base
// MODIFICADO: Adicionado "AND ativo = TRUE" para selecionar apenas alunos ativos
$sql = "SELECT id, nome_crianca, nome_responsavel, telefone_responsavel, horario, escola, valor_mensalidade_centavos, dia_vencimento FROM criancas WHERE ativo = TRUE"; 

// Adicionar filtros à query usando prepared statements
$params = [];
$types = ""; // Tipos para bind_param

if (!empty($filtro_escola)) {
    $sql .= " AND escola = ?";
    $params[] = $filtro_escola;
    $types .= "s";
}

if (!empty($filtro_horario)) {
    $sql .= " AND horario = ?";
    $params[] = $filtro_horario;
    $types .= "s";
}

// Ordenar (útil para agrupar visualmente no frontend)
$sql .= " ORDER BY horario ASC, escola ASC, nome_crianca ASC";

// Preparar a query
$stmt = $conn->prepare($sql);

if ($stmt === false) {
    echo json_encode(["success" => false, "message" => "Erro ao preparar a query: " . $conn->error]);
    $conn->close();
    exit();
}

// Bindar parâmetros se houver filtros
if (!empty($params)) {
    $stmt->bind_param($types, ...$params);
}

// Executar a query
if ($stmt->execute()) {
    $result = $stmt->get_result();
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $alunos[] = $row;
        }
    }
    $result->free();
    echo json_encode(["success" => true, "alunos" => $alunos]);
} else {
    echo json_encode(["success" => false, "message" => "Erro ao executar a query: " . $stmt->error]);
}

$stmt->close();
$conn->close();
?>

