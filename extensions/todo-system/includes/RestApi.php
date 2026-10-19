<?php
/**
 * REST route registration and bootstrap payload.
 */

namespace FleekDashTodoSystem;

defined('ABSPATH') || exit;

final class RestApi
{
    private const API_NAMESPACE = 'todo-system/v1';

    public static function register(): void
    {
        \add_action('rest_api_init', [self::class, 'registerRoutes']);
    }

    public static function registerRoutes(): void
    {
        \register_rest_route(self::API_NAMESPACE, '/bootstrap', [
            'methods' => 'GET',
            'callback' => [self::class, 'bootstrap'],
            'permission_callback' => [self::class, 'canEdit'],
        ]);

        \register_rest_route(self::API_NAMESPACE, '/projects', [
            [
                'methods' => 'GET',
                'callback' => [RestProjectController::class, 'listProjects'],
                'permission_callback' => [self::class, 'canEdit'],
            ],
            [
                'methods' => 'POST',
                'callback' => [RestProjectController::class, 'createProject'],
                'permission_callback' => [self::class, 'canEdit'],
            ],
        ]);

        \register_rest_route(self::API_NAMESPACE, '/projects/(?P<id>\d+)', [
            [
                'methods' => 'PUT',
                'callback' => [RestProjectController::class, 'updateProject'],
                'permission_callback' => [self::class, 'canEdit'],
                'args' => [
                    'id' => [
                        'type' => 'integer',
                        'required' => true,
                    ],
                ],
            ],
            [
                'methods' => 'DELETE',
                'callback' => [RestProjectController::class, 'deleteProject'],
                'permission_callback' => [self::class, 'canEdit'],
                'args' => [
                    'id' => [
                        'type' => 'integer',
                        'required' => true,
                    ],
                ],
            ],
        ]);

        \register_rest_route(self::API_NAMESPACE, '/tasks', [
            [
                'methods' => 'GET',
                'callback' => [RestTaskController::class, 'listTasks'],
                'permission_callback' => [self::class, 'canEdit'],
            ],
            [
                'methods' => 'POST',
                'callback' => [RestTaskController::class, 'createTask'],
                'permission_callback' => [self::class, 'canEdit'],
            ],
        ]);

        \register_rest_route(self::API_NAMESPACE, '/tasks/(?P<id>\d+)', [
            [
                'methods' => 'PUT',
                'callback' => [RestTaskController::class, 'updateTask'],
                'permission_callback' => [self::class, 'canEdit'],
                'args' => [
                    'id' => [
                        'type' => 'integer',
                        'required' => true,
                    ],
                ],
            ],
            [
                'methods' => 'DELETE',
                'callback' => [RestTaskController::class, 'deleteTask'],
                'permission_callback' => [self::class, 'canEdit'],
                'args' => [
                    'id' => [
                        'type' => 'integer',
                        'required' => true,
                    ],
                ],
            ],
        ]);
    }

    public static function canEdit(): bool
    {
        return \is_user_logged_in() && \current_user_can('edit_posts');
    }

    /**
     * @return \WP_REST_Response
     */
    public static function bootstrap(\WP_REST_Request $request): \WP_REST_Response
    {
        $tasksResponse = RestTaskController::listTasks($request)->get_data();

        return \rest_ensure_response([
            'success' => true,
            'projects' => RestProjectController::collectProjects(),
            'tasks' => $tasksResponse['tasks'] ?? [],
            'users' => RestSupport::fetchUsers(),
            'current_user_id' => (int) \get_current_user_id(),
        ]);
    }
}
