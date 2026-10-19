<?php
/**
 * Custom post type and taxonomy for the task management plugin.
 */

namespace FleekDashTodoSystem;

defined('ABSPATH') || exit;

final class PostTypes
{
    public const TASK_POST_TYPE = 'fd_task';
    public const PROJECT_TAXONOMY = 'fd_project';

    public static function register(): void
    {
        self::registerTaskPostType();
        self::registerProjectTaxonomy();
    }

    private static function registerTaskPostType(): void
    {
        \register_post_type(self::TASK_POST_TYPE, [
            'labels' => [
                'name' => 'Tasks',
                'singular_name' => 'Task',
                'add_new_item' => 'Add Task',
                'edit_item' => 'Edit Task',
                'search_items' => 'Search Tasks',
            ],
            'public' => false,
            'show_ui' => false,
            'show_in_rest' => true,
            'rest_base' => 'fd-tasks',
            'supports' => ['title', 'editor', 'author'],
            'capability_type' => 'post',
            'map_meta_cap' => true,
            'has_archive' => false,
            'rewrite' => false,
        ]);
    }

    private static function registerProjectTaxonomy(): void
    {
        \register_taxonomy(self::PROJECT_TAXONOMY, self::TASK_POST_TYPE, [
            'labels' => [
                'name' => 'Projects',
                'singular_name' => 'Project',
                'add_new_item' => 'Add Project',
                'search_items' => 'Search Projects',
            ],
            'public' => false,
            'show_ui' => false,
            'show_in_rest' => true,
            'rest_base' => 'fd-projects',
            'hierarchical' => true,
            'rewrite' => false,
        ]);
    }
}
