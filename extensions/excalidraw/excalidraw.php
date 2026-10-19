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
const FLEEKDASH_EXCALIDRAW_REGISTRAR_CLASS = '\FleekDash\Extension\ExtensionAppRegistrar';
const FLEEKDASH_EXCALIDRAW_MIN_FD = '2.6.7';

/**
 * True when the host FleekDash carries the declarative app registrar —
 * `fleekdash.json` is then the single writer (manifest sync owns the row,
 * lifecycle reconcile handles is_active) and every imperative path below
 * stays dormant. Only released FleekDash builds predating the registrar
 * still execute the PHP fallback.
 */
function fleekdashExcalidrawHasDeclarativeRegistrar(): bool
{
    return class_exists(FLEEKDASH_EXCALIDRAW_REGISTRAR_CLASS);
}

/**
 * Register/re-sync integration in FleekDash registry.
 *
 * Legacy fallback for FleekDash releases without the declarative registrar:
 * this register() still owns the row there, so the payload MUST keep
 * mirroring the manifest byte-for-byte on every forwarded field so both
 * writers produce the identical manifest shape (parity contract:
 * docs/future/integration-system/planning/
 * extension-migration-playbook-08-out-2026.md step 2). Once the fleet no
 * longer needs the fallback, this whole block is deleted.
 */
function fleekdashExcalidrawRegisterIntegration(): void
{
    if (fleekdashExcalidrawHasDeclarativeRegistrar() || !class_exists(FLEEKDASH_EXCALIDRAW_REGISTRY_CLASS)) {
        return;
    }

    // The manifest declares dist/pages/editor.html unconditionally — the
    // pages/ source needs the vite dev server and is never servable on its
    // own, so a pages/ fallback would only create parity drift.
    $editorHtmlRelative = 'dist/pages/editor.html';
    if (!is_file(__DIR__ . '/' . $editorHtmlRelative) && function_exists('fleekdash_log_error')) {
        fleekdash_log_error('[Excalidraw] Missing build output. Run pnpm run build in wp-content/plugins/excalidraw.');
    }

    // Do not expose an integration whose declared FleekDash requirement is unmet.
    if (!\defined('FLEEKDASH_VERSION') || \version_compare((string) FLEEKDASH_VERSION, FLEEKDASH_EXCALIDRAW_MIN_FD, '<')) {
        return;
    }

    $manifest = [
        'integration_id' => FLEEKDASH_EXCALIDRAW_INTEGRATION_ID,
        'name' => 'Excalidraw',
        'description' => 'Advanced native drawing tool for FleekDash — iframe editor route.',
        'version' => '1.1.0',
        'author' => 'FleekDash',
        'author_uri' => 'https://fleekdash.com',
        'integration_type' => 'standalone',
        'plugin_file' => plugin_basename(__FILE__),
        'icon' => 'edit',
        'kind' => 'app',
        'source' => 'external',
        'source_label' => 'Plugin',
        'category' => 'plugin',
        // Key order matters for the parity hash: the manifest discovery
        // normalizes `requires` to wp/fleekdash/php — mirror it exactly.
        'requires' => [
            'wp' => '6.5',
            'fleekdash' => FLEEKDASH_EXCALIDRAW_MIN_FD,
            'php' => '8.0',
        ],
        'tags' => ['drawing', 'editor', 'reference'],
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
    if (fleekdashExcalidrawHasDeclarativeRegistrar()) {
        return; // manifest sync creates/activates the row on the next request
    }
    fleekdashExcalidrawRegisterIntegration();
    if (class_exists(FLEEKDASH_EXCALIDRAW_REGISTRY_CLASS)) {
        $registryClass = FLEEKDASH_EXCALIDRAW_REGISTRY_CLASS;
        $registryClass::activate(FLEEKDASH_EXCALIDRAW_INTEGRATION_ID);
    }
});

register_deactivation_hook(__FILE__, static function (): void {
    if (fleekdashExcalidrawHasDeclarativeRegistrar()) {
        return; // reconcileActivation flips is_active on the next sync
    }
    if (class_exists(FLEEKDASH_EXCALIDRAW_REGISTRY_CLASS)) {
        $registryClass = FLEEKDASH_EXCALIDRAW_REGISTRY_CLASS;
        $registryClass::deactivate(FLEEKDASH_EXCALIDRAW_INTEGRATION_ID);
    }
});
