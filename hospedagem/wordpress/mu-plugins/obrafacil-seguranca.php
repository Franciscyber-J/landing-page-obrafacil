<?php
/**
 * Plugin Name: ObraFácil — Segurança
 * Description: Esconde quem são os usuários do WordPress, desliga o XML-RPC e não mostra a versão. Fica em wp-content/mu-plugins/ (sempre ativo, não aparece para desativar).
 * Version: 1.0.0
 *
 * Versionado em landing_page/hospedagem/wordpress/mu-plugins/obrafacil-seguranca.php.
 */

if (!defined('ABSPATH')) {
    exit;
}

// XML-RPC desligado: não é usado e permite testar centenas de senhas de uma vez.
add_filter('xmlrpc_enabled', '__return_false');
add_filter('xmlrpc_methods', function () {
    return array();
});

// API REST: a lista de usuários só responde para quem está logado.
add_filter('rest_pre_dispatch', function ($resultado, $servidor, $pedido) {
    $rota = $pedido->get_route();
    if (preg_match('#^/wp/v2/users#', $rota) && !is_user_logged_in()) {
        return new WP_Error('rest_forbidden', 'Acesso negado.', array('status' => 401));
    }
    return $resultado;
}, 10, 3);

// Página de autor e ?author=N (que revelam o nome de login): volta para o início.
add_action('template_redirect', function () {
    if (is_author() || (isset($_GET['author']) && !is_admin())) {
        wp_safe_redirect(home_url('/'), 301);
        exit;
    }
});

// O mapa do site do WordPress não lista usuários.
add_filter('wp_sitemaps_add_provider', function ($provedor, $nome) {
    return $nome === 'users' ? false : $provedor;
}, 10, 2);

// Login: mesma mensagem para usuário inexistente e senha errada.
add_filter('login_errors', function () {
    return 'Usuário ou senha incorretos.';
});

// Não mostrar a versão do WordPress nas páginas e nos feeds.
remove_action('wp_head', 'wp_generator');
add_filter('the_generator', '__return_empty_string');
