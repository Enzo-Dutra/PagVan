<?php
// Arquivo de configuração do banco de dados - db_config.php

define('DB_SERVER', 'localhost'); // Servidor do banco de dados (geralmente localhost no XAMPP)
define('DB_USERNAME', 'root');    // Usuário do banco de dados (padrão 'root' no XAMPP)
define('DB_PASSWORD', '');        // Senha do banco de dados (padrão vazio no XAMPP)
define('DB_NAME', 'pagvan');      // Nome do banco de dados

/* Tenta conectar ao banco de dados MySQL */
$link = mysqli_connect(DB_SERVER, DB_USERNAME, DB_PASSWORD, DB_NAME);

// Verifica a conexão
if($link === false){
    // Em um ambiente de produção, evite exibir erros detalhados para o usuário final.
    // Logue o erro ou mostre uma mensagem genérica.
    // die("ERRO: Não foi possível conectar. " . mysqli_connect_error());

    // Para desenvolvimento, podemos retornar o erro em JSON
    header('Content-Type: application/json');
    http_response_code(500); // Internal Server Error
    echo json_encode(['success' => false, 'message' => 'Erro de conexão com o banco de dados: ' . mysqli_connect_error()]);
    exit; // Termina a execução do script
}

// Define o charset para UTF-8 (importante para caracteres especiais)
mysqli_set_charset($link, "utf8");

?>
