<?php

declare(strict_types=1);

/**
 * FleekDash extension API - IDE stubs.
 *
 * These signatures mirror the runtime implementations shipped by FleekDash
 * (includes/Extension/snippet-functions.php, includes/Integration/Registry.php).
 * Do NOT include this file at runtime - it exists so extension authors get
 * autocompletion/docblocks when their editor indexes the package. The real
 * functions are defined by FleekDash itself and wrapped in function_exists()
 * guards.
 *
 * @package fleekdash/contracts
 */

if (false) {
	/**
	 * Register a snippet's metadata + settings schema.
	 *
	 * The id is optional: it defaults to the id of the file currently being
	 * loaded - the identity the loader and the Hub agree on
	 * (sanitize_key of the filename).
	 *
	 * @param string|array<string, mixed> $id_or_args Snippet id, or the args array.
	 * @param array<string, mixed>        $args       name, description, version, settings.
	 *                                                   Use fleekdash_register_settings_fields() for sections.
	 * @return void
	 */
	function fleekdash_register_snippet($id_or_args, array $args = []) {
	}

	/**
	 * Register settings fields to be injected into a FleekDash settings
	 * section (e.g. "performance"). Shared by snippets, manifests and core
	 * features - the injection mechanism is not snippet-exclusive.
	 *
	 * @param string               $section Target section slug.
	 * @param array<string, mixed> $schema  Field schema map (SettingsSchema shape).
	 * @param string|null          $owner   Owning extension id; defaults to current snippet.
	 * @return void
	 */
	function fleekdash_register_settings_fields(string $section, array $schema, ?string $owner = null) {
	}

	/**
	 * Derive the canonical snippet id from a file path - same sanitize_key
	 * rule used by discovery, the loader and the Hub.
	 *
	 * @param string $file Absolute or relative file path.
	 * @return string
	 */
	function fleekdash_snippet_id_from_file(string $file): string {
		return '';
	}
}

if (false) {
	/**
	 * Imperative route/registration API for kind:app: prefer declaring
	 * `routes` in fleekdash.json (the runtime sync registers them).
	 * Keep this call only during migration, with content identical to the
	 * JSON so both writers produce the same stored manifest. Real calls:
	 *
	 *     FleekDash\Integration\Registry::register( array $manifest );
	 *     FleekDash\Integration\Registry::unregister( string $id );
	 *
	 * $manifest shape (RegistryManifest):
	 *   integration_id, name, version, integration_type, plugin_file,
	 *   description?, author?, icon?, kind => 'app', category?,
	 *   routes[] => { path*, title*, component_url*, icon?, permissions?[], sandbox_mode? },
	 *   settings_schema? => SettingsSchema map,
	 *   settings_page_url?, requires?, tags?
	 *
	 * component_url: the imperative path stores the value verbatim, so
	 * callers must pass an already-absolute URL (e.g. plugins_url() of the
	 * built file) with `fleekdash_sdk_url` appended themselves; the JSON
	 * path resolves manifest-relative paths against the manifest dir and
	 * appends the param automatically.
	 * Call register() on activation/init and unregister() on deactivation.
	 * Sandbox modes: 'strict' | 'moderate' | 'none'.
	 */
}
