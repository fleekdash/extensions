<?php
/**
 * Plugin Name:       Excalidraw
 * Plugin URI:        https://github.com/fleekdash/extensions
 * Description:       A full Excalidraw drawing board inside FleekDash. Sketch diagrams, wireframes and visual boards without leaving wp-admin.
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

// Registration is fully declarative: `fleekdash.json` is the single writer
// (`ExtensionAppRegistrar` owns the row and lifecycle reconcile). This plugin
// ships no PHP registration code; requires.fleekdash floors at the first
// registrar-carrying release.
