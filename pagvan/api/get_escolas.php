<?php
header('Content-Type: application/json');

require_once 'db_config.php';

$escolas = [];

// Conectar ao banco de dados
$conn = new mysqli(DB_SERVER, DB_USERNAME, DB_PASSWORD, DB_NAME);

// Verificar conexão
if ($conn->connect_error) {
    echo json_encode(['success' => false, 'message' => 'Erro de conexão com o banco de dados: ' . $conn->connect_error]);
    exit();
}

// Definir charset para UTF-8 (importante para nomes com acentos)
$conn->set_charset("utf8mb4");

// Buscar escolas distintas
$sql = "SELECT DISTINCT escola FROM criancas WHERE escola IS NOT NULL AND escola != '' ORDER BY escola ASC";
$result = $conn->query($sql);

if ($result) {
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $escolas[] = $row['escola'];
        }
    }
    $result->free();
    echo json_encode(['success' => true, 'escolas' => $escolas]);
} else {
    echo json_encode(['success' => false, 'message' => 'Erro ao buscar escolas: ' . $conn->error]);
}

$conn->close();
?>

