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

// FleekDash registration is fully declarative: `fleekdash.json` is the
// single writer (`ExtensionAppRegistrar` owns the row and reconciles
// is_active from is_plugin_active()). requires.fleekdash floors at the
// first registrar-carrying release.

\register_activation_hook(__FILE__, static function (): void {
    fleekdashTaskSystemBootstrap();
    \flush_rewrite_rules();
});

\register_deactivation_hook(__FILE__, static function (): void {
    \flush_rewrite_rules();
});
