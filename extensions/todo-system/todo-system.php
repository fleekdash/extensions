<?php
/**
 * Plugin Name:       Task System
 * Plugin URI:        https://github.com/fleekdash/extensions
 * Description:       Asana-style task manager for FleekDash, doubling as a live tour of every extension API capability.
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

const FLEEKDASH_TASK_SYSTEM_INTEGRATION_ID = 'todo-system';
const FLEEKDASH_TASK_SYSTEM_VERSION = '1.1.0';
const FLEEKDASH_TASK_SYSTEM_REGISTRY_CLASS = '\FleekDash\Integration\Registry';
const FLEEKDASH_TASK_SYSTEM_REGISTRAR_CLASS = '\FleekDash\Extension\ExtensionAppRegistrar';
const FLEEKDASH_TASK_SYSTEM_MIN_FD = '2.6.7';

$taskSystemAutoload = __DIR__ . '/vendor/autoload.php';
if (\is_file($taskSystemAutoload)) {
    require_once $taskSystemAutoload;
} else {
    require_once __DIR__ . '/includes/PostTypes.php';
    require_once __DIR__ . '/includes/Meta.php';
    require_once __DIR__ . '/includes/RestSupport.php';
    require_once __DIR__ . '/includes/RestProjectController.php';
    require_once __DIR__ . '/includes/RestTaskController.php';
    require_once __DIR__ . '/includes/RestApi.php';
}

use FleekDashTodoSystem\Meta;
use FleekDashTodoSystem\PostTypes;
use FleekDashTodoSystem\RestApi;

/**
 * Bootstrap CPT, meta, and REST for the task management plugin.
 */
function fleekdashTaskSystemBootstrap(): void
{
    PostTypes::register();
    Meta::register();
    RestApi::register();
}

\add_action('init', 'fleekdashTaskSystemBootstrap');

/**
 * True when the host FleekDash carries the declarative app registrar -
 * `fleekdash.json` is then the single writer (manifest sync owns the row,
 * lifecycle reconcile handles is_active) and every imperative path below
 * stays dormant. Only released FleekDash builds predating the registrar
 * still execute the PHP fallback.
 */
function fleekdashTaskSystemHasDeclarativeRegistrar(): bool
{
    return class_exists(FLEEKDASH_TASK_SYSTEM_REGISTRAR_CLASS);
}

/**
 * Declarative settings schema - identical to `fleekdash.json > settings`.
 * Exposed so the imperative fallback below can forward the same map under
 * the legacy `settings_schema` key (parity contract).
 *
 * @return array<string, array<string, mixed>>
 */
function fleekdashTaskSystemSettingsSchema(): array
{
    return [
        'default_view' => [
            'type' => 'select',
            'label' => 'Default view',
            'description' => 'View the app opens with.',
            'options' => ['list' => 'List', 'board' => 'Board'],
            'default' => 'list',
        ],
        'open_tasks_badge' => [
            'type' => 'toggle',
            'label' => 'Open-task menu badge',
            'description' => 'Show the number of open tasks on the Task System menu item.',
            'default' => true,
        ],
        'badge_color' => [
            'type' => 'select',
            'label' => 'Badge color',
            'options' => [
                'blue' => 'Blue',
                'green' => 'Green',
                'red' => 'Red',
                'purple' => 'Purple',
            ],
            'default' => 'blue',
        ],
        'tasks_per_page' => [
            'type' => 'number',
            'label' => 'Tasks per page',
            'description' => 'Soft cap for the list view.',
            'min' => 5,
            'max' => 100,
            'step' => 5,
            'default' => 50,
        ],
        'quick_add_placeholder' => [
            'type' => 'string',
            'label' => 'Quick-add placeholder',
            'description' => 'Placeholder text for the inline task input.',
            'default' => 'Add a task…',
        ],
        'debug_logging' => [
            'type' => 'toggle',
            'label' => 'SDK debug logging',
            'description' => 'Log SDK calls through the FleekDash debug channel.',
            'default' => false,
        ],
    ];
}

/**
 * Register/re-sync integration in FleekDash registry.
 *
 * Legacy fallback for FleekDash releases without the declarative registrar:
 * this register() still owns the row there, so the payload MUST keep
 * mirroring the manifest byte-for-byte on every forwarded field so both
 * writers produce the identical manifest shape (parity contract - see
 * extensions/excalidraw for the reference implementation).
 */
function fleekdashTaskSystemRegisterIntegration(): void
{
    if (fleekdashTaskSystemHasDeclarativeRegistrar() || !\class_exists(FLEEKDASH_TASK_SYSTEM_REGISTRY_CLASS)) {
        return;
    }

    // The manifest declares dist/* unconditionally - the pages/ sources need
    // the vite dev server and are never servable on their own.
    $appHtmlRelative = 'dist/pages/app.html';
    $apiDemoHtmlRelative = 'dist/pages/api-demo.html';

    if (
        (!\is_file(__DIR__ . '/' . $appHtmlRelative) || !\is_file(__DIR__ . '/' . $apiDemoHtmlRelative))
        && \function_exists('fleekdash_log_error')
    ) {
        \fleekdash_log_error(
            '[Task System] Missing build output. Run pnpm run build in wp-content/plugins/todo-system.',
        );
    }

    // Do not expose an integration whose declared FleekDash requirement is unmet.
    if (!\defined('FLEEKDASH_VERSION') || \version_compare((string) FLEEKDASH_VERSION, FLEEKDASH_TASK_SYSTEM_MIN_FD, '<')) {
        return;
    }

    $sdkUrl = \plugins_url(
        'public/sdk/fleekdash-sdk.js',
        \defined('FLEEKDASH_PLUGIN_FILE') ? FLEEKDASH_PLUGIN_FILE : __FILE__
    );

    $manifest = [
        'integration_id' => FLEEKDASH_TASK_SYSTEM_INTEGRATION_ID,
        'name' => 'Task System',
        'description' => 'Reference FleekDash extension - Asana-style task management plus a live tour of every extension API capability.',
        'version' => FLEEKDASH_TASK_SYSTEM_VERSION,
        'author' => 'FleekDash',
        'author_uri' => 'https://fleekdash.com',
        'integration_type' => 'standalone',
        'plugin_file' => \plugin_basename(__FILE__),
        'icon' => 'check',
        'kind' => 'app',
        'source' => 'external',
        'source_label' => 'Plugin',
        'category' => 'plugin',
        // Key order matters for the parity hash: manifest discovery
        // normalizes `requires` to wp/fleekdash/php - mirror it exactly.
        'requires' => [
            'wp' => '6.5',
            'fleekdash' => FLEEKDASH_TASK_SYSTEM_MIN_FD,
            'php' => '8.0',
        ],
        'tags' => ['tasks', 'productivity', 'reference', 'sdk-demo'],
        'settings_schema' => fleekdashTaskSystemSettingsSchema(),
        'routes' => [
            [
                'path' => 'todo-system/app',
                'title' => 'Task System',
                'component_url' => \add_query_arg(
                    'fleekdash_sdk_url',
                    $sdkUrl,
                    \plugins_url($appHtmlRelative, __FILE__)
                ),
                'icon' => 'check',
                'permissions' => ['edit_posts'],
                'sandbox_mode' => 'none',
            ],
            [
                'path' => 'todo-system/api-demo',
                'title' => 'SDK API Demo',
                'component_url' => \add_query_arg(
                    'fleekdash_sdk_url',
                    $sdkUrl,
                    \plugins_url($apiDemoHtmlRelative, __FILE__)
                ),
                'icon' => 'code',
                'permissions' => ['edit_posts'],
                'sandbox_mode' => 'none',
            ],
        ],
    ];

    $registryClass = FLEEKDASH_TASK_SYSTEM_REGISTRY_CLASS;
    $registryClass::register($manifest);
}

\add_action('plugins_loaded', 'fleekdashTaskSystemRegisterIntegration', 30);

\register_activation_hook(__FILE__, static function (): void {
    if (fleekdashTaskSystemHasDeclarativeRegistrar()) {
        return; // manifest sync creates/activates the row on the next request
    }
    if (!\defined('FLEEKDASH_VERSION') || \version_compare((string) FLEEKDASH_VERSION, FLEEKDASH_TASK_SYSTEM_MIN_FD, '<')) {
        return;
    }
    fleekdashTaskSystemBootstrap();
    \flush_rewrite_rules();
    fleekdashTaskSystemRegisterIntegration();
    if (\class_exists(FLEEKDASH_TASK_SYSTEM_REGISTRY_CLASS)) {
        $registryClass = FLEEKDASH_TASK_SYSTEM_REGISTRY_CLASS;
        $registryClass::activate(FLEEKDASH_TASK_SYSTEM_INTEGRATION_ID);
    }
});

\register_deactivation_hook(__FILE__, static function (): void {
    \flush_rewrite_rules();
    if (fleekdashTaskSystemHasDeclarativeRegistrar()) {
        return; // reconcileActivation flips is_active on the next sync
    }
    if (\class_exists(FLEEKDASH_TASK_SYSTEM_REGISTRY_CLASS)) {
        $registryClass = FLEEKDASH_TASK_SYSTEM_REGISTRY_CLASS;
        $registryClass::deactivate(FLEEKDASH_TASK_SYSTEM_INTEGRATION_ID);
    }
});
