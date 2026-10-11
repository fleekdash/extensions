<?php
/**
 * Plugin Name:       Excalidraw
 * Plugin URI:        https://github.com/fleekdash/extensions
 * Description:       Advanced native drawing tool for FleekDash — iframe editor route.
 * Version:           1.1.0
 * Requires at least: 6.5
 * Requires PHP:      8.0
 * Requires Plugins:  fleekdash
 * Author:            FleekDash
 * Author URI:        https://fleekdash.com
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 */

defined('ABSPATH') || exit;

const FLEEKDASH_EXCALIDRAW_INTEGRATION_ID = 'excalidraw';
const FLEEKDASH_EXCALIDRAW_REGISTRY_CLASS = '\FleekDash\Integration\Registry';
const FLEEKDASH_EXCALIDRAW_MIN_FD = '2.6.7';

/**
 * Register/re-sync integration in FleekDash registry.
 *
 * Transitional model: `fleekdash.json` declares the extension (Hub card,
 * requirements); routes still go through Registry::register() until the
 * manifest absorbs them.
 */
function fleekdashExcalidrawRegisterIntegration(): void
{
    if (!class_exists(FLEEKDASH_EXCALIDRAW_REGISTRY_CLASS)) {
        return;
    }

    $distEditor = __DIR__ . '/dist/pages/editor.html';
    $editorHtmlRelative = is_file($distEditor)
        ? 'dist/pages/editor.html'
        : 'pages/editor.html';
    if (!is_file($distEditor) && function_exists('fleekdash_log_error')) {
        fleekdash_log_error('[Excalidraw] Missing build output. Run pnpm run build in wp-content/plugins/excalidraw.');
    }

    // Do not expose an integration whose declared FleekDash requirement is unmet.
    if (\defined('FLEEKDASH_VERSION') && \version_compare((string) FLEEKDASH_VERSION, FLEEKDASH_EXCALIDRAW_MIN_FD, '<')) {
        return;
    }

    $manifest = [
        'integration_id' => FLEEKDASH_EXCALIDRAW_INTEGRATION_ID,
        'name' => 'Excalidraw',
        'description' => 'Advanced native drawing tool for FleekDash',
        'version' => '1.1.0',
        'author' => 'FleekDash',
        'author_uri' => 'https://fleekdash.com',
        'integration_type' => 'standalone',
        'plugin_file' => plugin_basename(__FILE__),
        'icon' => 'edit',
        'source' => 'external',
        'source_label' => 'Plugin',
        'category' => 'plugin',
        'requires' => [
            'wp' => '6.5',
            'php' => '8.0',
            'fleekdash' => FLEEKDASH_EXCALIDRAW_MIN_FD,
        ],
        'routes' => [
            [
                'path' => 'excalidraw/editor',
                'title' => 'Excalidraw Editor',
                'component_url' => \add_query_arg(
                    'fleekdash_sdk_url',
                    \plugins_url('public/sdk/fleekdash-sdk.js', \defined('FLEEKDASH_PLUGIN_FILE') ? FLEEKDASH_PLUGIN_FILE : __FILE__),
                    \plugins_url($editorHtmlRelative, __FILE__)
                ),
                'icon' => 'edit',
                'permissions' => ['authenticated'],
                // First-party plugin on same origin — no sandbox needed (avoids allow-scripts+allow-same-origin warning)
                'sandbox_mode' => 'none',
            ],
        ],
    ];

    $registryClass = FLEEKDASH_EXCALIDRAW_REGISTRY_CLASS;
    $registryClass::register($manifest);
}

add_action('plugins_loaded', 'fleekdashExcalidrawRegisterIntegration', 30);

register_activation_hook(__FILE__, static function (): void {
    fleekdashExcalidrawRegisterIntegration();
    if (class_exists(FLEEKDASH_EXCALIDRAW_REGISTRY_CLASS)) {
        $registryClass = FLEEKDASH_EXCALIDRAW_REGISTRY_CLASS;
        $registryClass::activate(FLEEKDASH_EXCALIDRAW_INTEGRATION_ID);
    }
});

register_deactivation_hook(__FILE__, static function (): void {
    if (class_exists(FLEEKDASH_EXCALIDRAW_REGISTRY_CLASS)) {
        $registryClass = FLEEKDASH_EXCALIDRAW_REGISTRY_CLASS;
        $registryClass::deactivate(FLEEKDASH_EXCALIDRAW_INTEGRATION_ID);
    }
});
