<?php
/**
 * REST handlers for task post type endpoints.
 */

namespace FleekDashTodoSystem;

defined('ABSPATH') || exit;

final class RestTaskController
{
    private const ERROR_CREATE_FAILED = 'create_failed';
    private const ERROR_UPDATE_FAILED = 'update_failed';
    private const MESSAGE_LOAD_FAILED = 'Failed to load task';
    /**
     * @return \WP_REST_Response
     */
    public static function listTasks(\WP_REST_Request $request): \WP_REST_Response
    {
        $projectId = (int) ($request->get_param('project_id') ?? 0);
        $args = [
            'post_type' => PostTypes::TASK_POST_TYPE,
            'post_status' => 'publish',
            'posts_per_page' => 200,
            'orderby' => 'date',
            'order' => 'ASC',
        ];

        if ($projectId > 0) {
            $args['tax_query'] = [
                [
                    'taxonomy' => PostTypes::PROJECT_TAXONOMY,
                    'field' => 'term_id',
                    'terms' => [$projectId],
                ],
            ];
        }

        $query = new \WP_Query($args);
        $tasks = [];
        foreach ($query->posts as $post) {
            if ($post instanceof \WP_Post) {
                $tasks[] = self::formatTask($post);
            }
        }

        return \rest_ensure_response([
            'success' => true,
            'tasks' => $tasks,
        ]);
    }

    /**
     * @return \WP_REST_Response|\WP_Error
     */
    public static function createTask(\WP_REST_Request $request)
    {
        $title = \sanitize_text_field((string) $request->get_param('title'));
        if ($title === '') {
            return new \WP_Error('invalid_title', 'Task title is required', ['status' => 400]);
        }

        $projectId = (int) ($request->get_param('project_id') ?? 0);
        $meta = self::buildTaskMetaFromRequest($request, true);

        $postId = \wp_insert_post([
            'post_type' => PostTypes::TASK_POST_TYPE,
            'post_title' => $title,
            'post_content' => \wp_kses_post((string) ($request->get_param('description') ?? '')),
            'post_status' => 'publish',
            'post_author' => \get_current_user_id(),
        ], true);

        if (\is_wp_error($postId)) {
            return $postId;
        }

        if ($projectId > 0) {
            \wp_set_object_terms($postId, [$projectId], PostTypes::PROJECT_TAXONOMY);
        }

        self::persistTaskMeta($postId, $meta);

        return self::taskSuccessResponse((int) $postId);
    }

    /**
     * @return \WP_REST_Response|\WP_Error
     */
    public static function updateTask(\WP_REST_Request $request)
    {
        $taskId = (int) $request->get_param('id');
        $loadError = self::assertTaskPost($taskId);
        if ($loadError instanceof \WP_Error) {
            return $loadError;
        }

        $postError = self::applyTaskPostFields($taskId, $request);
        if ($postError instanceof \WP_Error) {
            return $postError;
        }

        self::applyTaskProject($taskId, $request);

        $meta = self::buildTaskMetaFromRequest($request, false);
        if ($meta !== []) {
            self::persistTaskMeta($taskId, $meta);
        }

        return self::taskSuccessResponse($taskId, self::ERROR_UPDATE_FAILED, self::MESSAGE_LOAD_FAILED);
    }

    /**
     * @return \WP_REST_Response|\WP_Error
     */
    public static function deleteTask(\WP_REST_Request $request)
    {
        $taskId = (int) $request->get_param('id');
        $loadError = self::assertTaskPost($taskId);
        if ($loadError instanceof \WP_Error) {
            return $loadError;
        }

        $deleted = \wp_delete_post($taskId, true);
        if (!$deleted) {
            return new \WP_Error('delete_failed', 'Failed to delete task', ['status' => 500]);
        }

        return \rest_ensure_response([
            'success' => true,
            'deleted' => $taskId,
        ]);
    }

    /**
     * @return \WP_Error|null
     */
    private static function assertTaskPost(int $taskId): ?\WP_Error
    {
        $post = \get_post($taskId);
        $isTask = $post instanceof \WP_Post && $post->post_type === PostTypes::TASK_POST_TYPE;
        if (!$isTask) {
            return new \WP_Error('not_found', 'Task not found', ['status' => 404]);
        }

        return null;
    }

    /**
     * @return \WP_Error|null
     */
    private static function applyTaskPostFields(int $taskId, \WP_REST_Request $request): ?\WP_Error
    {
        $update = ['ID' => $taskId];
        $title = $request->get_param('title');
        if (\is_string($title)) {
            $update['post_title'] = \sanitize_text_field($title);
        }

        $description = $request->get_param('description');
        if (\is_string($description)) {
            $update['post_content'] = \wp_kses_post($description);
        }

        if (\count($update) <= 1) {
            return null;
        }

        $result = \wp_update_post($update, true);
        return \is_wp_error($result) ? $result : null;
    }

    private static function applyTaskProject(int $taskId, \WP_REST_Request $request): void
    {
        if ($request->get_param('project_id') === null) {
            return;
        }

        $projectId = (int) $request->get_param('project_id');
        if ($projectId > 0) {
            \wp_set_object_terms($taskId, [$projectId], PostTypes::PROJECT_TAXONOMY);
        }
    }

    /**
     * @return array<string, mixed>
     */
    private static function buildTaskMetaFromRequest(\WP_REST_Request $request, bool $isCreate): array
    {
        if ($isCreate) {
            return [
                'status' => RestSupport::sanitizeStatus((string) ($request->get_param('status') ?? 'todo')),
                'priority' => RestSupport::sanitizePriority((string) ($request->get_param('priority') ?? 'none')),
                'due_date' => \sanitize_text_field((string) ($request->get_param('due_date') ?? '')),
                'section' => \sanitize_text_field(
                    (string) ($request->get_param('section') ?? RestSupport::defaultSection()),
                ),
                'sort_order' => (int) ($request->get_param('sort_order') ?? time()),
                'assignee_ids' => RestSupport::sanitizeIntArray($request->get_param('assignee_ids')),
                'linked_post_ids' => RestSupport::sanitizeIntArray($request->get_param('linked_post_ids')),
            ];
        }

        $meta = [];
        $scalarFields = ['status', 'priority', 'due_date', 'section', 'sort_order'];

        foreach ($scalarFields as $field) {
            if ($request->get_param($field) === null) {
                continue;
            }

            if ($field === 'status') {
                $meta['status'] = RestSupport::sanitizeStatus((string) $request->get_param('status'));
                continue;
            }
            if ($field === 'priority') {
                $meta['priority'] = RestSupport::sanitizePriority((string) $request->get_param('priority'));
                continue;
            }
            if ($field === 'sort_order') {
                $meta['sort_order'] = (int) $request->get_param('sort_order');
                continue;
            }

            $meta[$field] = \sanitize_text_field((string) $request->get_param($field));
        }

        if ($request->get_param('assignee_ids') !== null) {
            $meta['assignee_ids'] = RestSupport::sanitizeIntArray($request->get_param('assignee_ids'));
        }
        if ($request->get_param('linked_post_ids') !== null) {
            $meta['linked_post_ids'] = RestSupport::sanitizeIntArray($request->get_param('linked_post_ids'));
        }

        return $meta;
    }

    /**
     * @return \WP_REST_Response|\WP_Error
     */
    private static function taskSuccessResponse(
        int $taskId,
        string $errorCode = self::ERROR_CREATE_FAILED,
        string $errorMessage = self::MESSAGE_LOAD_FAILED,
    ) {
        $post = \get_post($taskId);
        if (!$post instanceof \WP_Post) {
            return new \WP_Error($errorCode, $errorMessage, ['status' => 500]);
        }

        return \rest_ensure_response([
            'success' => true,
            'task' => self::formatTask($post),
        ]);
    }

    /**
     * @param array<string, mixed> $meta
     */
    private static function persistTaskMeta(int $postId, array $meta): void
    {
        $map = [
            'status' => 'fd_task_status',
            'priority' => 'fd_task_priority',
            'due_date' => 'fd_task_due_date',
            'section' => 'fd_task_section',
            'sort_order' => 'fd_task_sort_order',
            'assignee_ids' => 'fd_task_assignee_ids',
            'linked_post_ids' => 'fd_task_linked_post_ids',
        ];

        foreach ($map as $inputKey => $metaKey) {
            if (!\array_key_exists($inputKey, $meta)) {
                continue;
            }
            \update_post_meta($postId, $metaKey, $meta[$inputKey]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    private static function formatTask(\WP_Post $post): array
    {
        $terms = \wp_get_object_terms($post->ID, PostTypes::PROJECT_TAXONOMY);
        $projectId = 0;
        if (!\is_wp_error($terms) && isset($terms[0]) && $terms[0] instanceof \WP_Term) {
            $projectId = (int) $terms[0]->term_id;
        }

        $assigneeIds = RestSupport::sanitizeIntArray(
            \get_post_meta($post->ID, 'fd_task_assignee_ids', true),
        );
        $linkedPostIds = RestSupport::sanitizeIntArray(
            \get_post_meta($post->ID, 'fd_task_linked_post_ids', true),
        );

        return [
            'id' => (int) $post->ID,
            'title' => $post->post_title,
            'description' => $post->post_content,
            'project_id' => $projectId,
            'status' => RestSupport::sanitizeStatus(
                (string) \get_post_meta($post->ID, 'fd_task_status', true),
            ),
            'priority' => RestSupport::sanitizePriority(
                (string) \get_post_meta($post->ID, 'fd_task_priority', true),
            ),
            'due_date' => (string) \get_post_meta($post->ID, 'fd_task_due_date', true),
            'section' => (string) (
                \get_post_meta($post->ID, 'fd_task_section', true) ?: RestSupport::defaultSection()
            ),
            'sort_order' => (int) \get_post_meta($post->ID, 'fd_task_sort_order', true),
            'assignee_ids' => $assigneeIds,
            'linked_post_ids' => $linkedPostIds,
            'linked_posts' => self::resolveLinkedPosts($linkedPostIds),
            'created_at' => $post->post_date_gmt,
            'updated_at' => $post->post_modified_gmt,
        ];
    }

    /**
     * @param list<int> $ids
     * @return list<array{id:int,title:string,link:string,status:string}>
     */
    private static function resolveLinkedPosts(array $ids): array
    {
        $result = [];
        foreach ($ids as $id) {
            $linked = \get_post($id);
            if (!$linked instanceof \WP_Post) {
                continue;
            }
            $result[] = [
                'id' => (int) $linked->ID,
                'title' => $linked->post_title,
                'link' => (string) \get_permalink($linked),
                'status' => $linked->post_status,
            ];
        }

        return $result;
    }
}
