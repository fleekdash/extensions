/**
 * Settings field schema — mirrors `ManifestSettingsSchemaValidator::validate()`
 * (includes/Integration/ManifestSettingsSchemaValidator.php). Shared by
 * `manifest.settings`, `manifest.sections`, Registry `settings_schema`,
 * and `fleekdash_register_settings_fields()`.
 */

/** Field `type` is free-form; these are the values the renderers know. */
export type SettingsFieldType =
  | "string"
  | "text"
  | "textarea"
  | "password"
  | "number"
  | "range"
  | "toggle"
  | "checkbox"
  | "select"
  | "radio"
  | "url"
  | "email"
  | "color"
  | "date";

export interface SettingsField {
  /** Input type; defaults to "string". */
  type?: SettingsFieldType | (string & {});
  label?: string;
  description?: string;
  required?: boolean;
  /** Stored encrypted (api keys, secrets). */
  encrypted?: boolean;
  /**
   * Registry-less storage: plain WP option name this field reads/writes
   * (ExtensionSettingsStore). Omit to use the extension's settings blob.
   */
  option_key?: string;
  /** Value-to-label options for select/radio. */
  options?: Record<string, string>;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  /** Sanitized per `type` server-side. */
  default?: unknown;
}

/** Map of field key → schema (keys are sanitize_key'd). */
export type SettingsSchema = Record<string, SettingsField>;
