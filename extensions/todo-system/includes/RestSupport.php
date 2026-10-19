<?php
/**
 * Shared REST helpers (sanitization, users, defaults).
 */

namespace FleekDashTodoSystem;

defined('ABSPATH') || exit;

final class RestSupport
{
    public const DEFAULT_PROJECT_COLOR = '#4573D2';
    private const DEFAULT_SECTION = 'Untitled section';

    public static function sanitizeStatus(string $status): string
    {
        $allowed = ['todo', 'in_progress', 'done', 'blocked'];
        return \in_array($status, $allowed, true) ? $status : 'todo';
    }

    public static function sanitizePriority(string $priority): string
    {
        $allowed = ['none', 'low', 'medium', 'high', 'urgent'];
        return \in_array($priority, $allowed, true) ? $priority : 'none';
    }

    /**
     * @param mixed $value
     * @return list<int>
     */
    public static function sanitizeIntArray($value): array
    {
        if (!\is_array($value)) {
            return [];
        }

        $ids = [];
        foreach ($value as $item) {
            $id = (int) $item;
            if ($id > 0) {
                $ids[] = $id;
            }
        }

        return \array_values(\array_unique($ids));
    }

    public static function defaultSection(): string
    {
        return self::DEFAULT_SECTION;
    }

    public static function resolveProjectColor(mixed $color): string
    {
        if (!\is_string($color) || $color === '') {
            return self::DEFAULT_PROJECT_COLOR;
        }

        $safeColor = \sanitize_hex_color($color);
        return $safeColor ?: self::DEFAULT_PROJECT_COLOR;
    }

    /**
     * @return list<array{id:int,name:string,email:string,avatar:string}>
     */
    public static function fetchUsers(): array
    {
        $users = \get_users([
            'number' => 100,
            'orderby' => 'display_name',
            'order' => 'ASC',
        ]);

        $result = [];
        foreach ($users as $user) {
            if (!$user instanceof \WP_User) {
                continue;
            }
            $result[] = [
                'id' => (int) $user->ID,
                'name' => $user->display_name,
                'email' => $user->user_email,
                'avatar' => (string) \get_avatar_url($user->ID, ['size' => 64]),
            ];
        }

        return $result;
    }
}
