<?php
/**
 * Task meta fields exposed via REST for the task management plugin.
 */

namespace FleekDashTodoSystem;

defined('ABSPATH') || exit;

final class Meta
{
    private const META_KEYS = [
        'fd_task_status',
        'fd_task_priority',
        'fd_task_due_date',
        'fd_task_section',
        'fd_task_sort_order',
        'fd_task_assignee_ids',
        'fd_task_linked_post_ids',
    ];

    public static function register(): void
    {
        foreach (self::META_KEYS as $key) {
            \register_post_meta(PostTypes::TASK_POST_TYPE, $key, [
                'single' => true,
                'type' => self::metaType($key),
                'show_in_rest' => false,
                'auth_callback' => static function (): bool {
                    return \current_user_can('edit_posts');
                },
            ]);
        }
    }

    private static function metaType(string $key): string
    {
        if ($key === 'fd_task_sort_order') {
            return 'integer';
        }
        if ($key === 'fd_task_assignee_ids' || $key === 'fd_task_linked_post_ids') {
            return 'array';
        }
        return 'string';
    }

    /**
     * @return array<string, mixed>
     */
    private static function metaSchema(string $key): array
    {
        if ($key === 'fd_task_sort_order') {
            return [
                'type' => 'integer',
                'default' => 0,
            ];
        }

        if ($key === 'fd_task_assignee_ids' || $key === 'fd_task_linked_post_ids') {
            return [
                'type' => 'array',
                'items' => ['type' => 'integer'],
                'default' => [],
            ];
        }

        $defaults = [
            'fd_task_status' => 'todo',
            'fd_task_priority' => 'none',
            'fd_task_due_date' => '',
            'fd_task_section' => 'Untitled section',
        ];

        return [
            'type' => 'string',
            'default' => $defaults[$key] ?? '',
        ];
    }
}
