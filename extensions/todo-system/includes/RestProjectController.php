<?php
/**
 * REST handlers for project taxonomy endpoints.
 */

namespace FleekDashTodoSystem;

defined('ABSPATH') || exit;

final class RestProjectController
{
    private const ERROR_CREATE_FAILED = 'create_failed';
    private const ERROR_UPDATE_FAILED = 'update_failed';
    private const MESSAGE_LOAD_FAILED = 'Failed to load project';
    /**
     * @return \WP_REST_Response
     */
    public static function listProjects(): \WP_REST_Response
    {
        return \rest_ensure_response([
            'success' => true,
            'projects' => self::collectProjects(),
        ]);
    }

    /**
     * @return \WP_REST_Response|\WP_Error
     */
    public static function createProject(\WP_REST_Request $request)
    {
        $name = \sanitize_text_field((string) $request->get_param('name'));
        if ($name === '') {
            return new \WP_Error('invalid_name', 'Project name is required', ['status' => 400]);
        }

        $description = \sanitize_textarea_field((string) ($request->get_param('description') ?? ''));
        $color = RestSupport::resolveProjectColor($request->get_param('color'));

        $inserted = \wp_insert_term($name, PostTypes::PROJECT_TAXONOMY, [
            'description' => $description,
        ]);

        $response = self::buildProjectMutationResponse(
            $inserted,
            self::ERROR_CREATE_FAILED,
            self::MESSAGE_LOAD_FAILED,
        );
        if ($response instanceof \WP_Error) {
            return $response;
        }

        \update_term_meta((int) $inserted['term_id'], 'fd_project_color', $color);

        return self::projectSuccessResponse((int) $inserted['term_id']);
    }

    /**
     * @return \WP_REST_Response|\WP_Error
     */
    public static function updateProject(\WP_REST_Request $request)
    {
        $termId = (int) $request->get_param('id');
        $termError = self::getProjectTerm($termId);
        if ($termError instanceof \WP_Error) {
            return $termError;
        }

        $updateError = self::applyProjectFields($termId, $request);
        if ($updateError instanceof \WP_Error) {
            return $updateError;
        }

        self::applyProjectColor($termId, $request);

        return self::projectSuccessResponse($termId, self::ERROR_UPDATE_FAILED, self::MESSAGE_LOAD_FAILED);
    }

    /**
     * @return \WP_REST_Response|\WP_Error
     */
    public static function deleteProject(\WP_REST_Request $request)
    {
        $termId = (int) $request->get_param('id');
        $taskIds = \get_posts([
            'post_type' => PostTypes::TASK_POST_TYPE,
            'post_status' => 'any',
            'posts_per_page' => -1,
            'fields' => 'ids',
            'tax_query' => [
                [
                    'taxonomy' => PostTypes::PROJECT_TAXONOMY,
                    'field' => 'term_id',
                    'terms' => [$termId],
                ],
            ],
        ]);
        foreach ($taskIds as $taskId) {
            if (!\wp_delete_post((int) $taskId, true)) {
                return new \WP_Error('delete_failed', 'Failed to delete project tasks', ['status' => 500]);
            }
        }

        $deleted = \wp_delete_term($termId, PostTypes::PROJECT_TAXONOMY);

        if (\is_wp_error($deleted) || $deleted === false) {
            return new \WP_Error('delete_failed', 'Failed to delete project', ['status' => 500]);
        }

        return \rest_ensure_response([
            'success' => true,
            'deleted' => $termId,
        ]);
    }

    /**
     * @return list<array<string, mixed>>
     */
    public static function collectProjects(): array
    {
        $terms = \get_terms([
            'taxonomy' => PostTypes::PROJECT_TAXONOMY,
            'hide_empty' => false,
        ]);

        $projects = [];
        if (!\is_wp_error($terms) && \is_array($terms)) {
            foreach ($terms as $term) {
                if ($term instanceof \WP_Term) {
                    $projects[] = self::formatProject($term);
                }
            }
        }

        if ($projects === []) {
            $default = self::ensureDefaultProject();
            if ($default !== null) {
                $projects[] = $default;
            }
        }

        return $projects;
    }

    /**
     * @return array<string, mixed>
     */
    public static function formatProject(\WP_Term $term): array
    {
        $color = \get_term_meta($term->term_id, 'fd_project_color', true);

        return [
            'id' => (int) $term->term_id,
            'name' => $term->name,
            'description' => $term->description,
            'color' => \is_string($color) && $color !== ''
                ? $color
                : RestSupport::DEFAULT_PROJECT_COLOR,
            'count' => (int) $term->count,
        ];
    }

    /**
     * @return \WP_Term|\WP_Error
     */
    private static function getProjectTerm(int $termId)
    {
        $term = \get_term($termId, PostTypes::PROJECT_TAXONOMY);
        if (!$term instanceof \WP_Term) {
            return new \WP_Error('not_found', 'Project not found', ['status' => 404]);
        }

        return $term;
    }

    /**
     * @param array<string, mixed>|\WP_Error $inserted
     * @return array<string, mixed>|\WP_Error
     */
    private static function buildProjectMutationResponse($inserted, string $errorCode, string $errorMessage)
    {
        if (\is_wp_error($inserted)) {
            return $inserted;
        }

        if (!\is_array($inserted) || !isset($inserted['term_id'])) {
            return new \WP_Error($errorCode, $errorMessage, ['status' => 500]);
        }

        return $inserted;
    }

    /**
     * @return \WP_REST_Response|\WP_Error
     */
    private static function projectSuccessResponse(
        int $termId,
        string $errorCode = self::ERROR_CREATE_FAILED,
        string $errorMessage = self::MESSAGE_LOAD_FAILED,
    ) {
        $term = \get_term($termId, PostTypes::PROJECT_TAXONOMY);
        if (!$term instanceof \WP_Term) {
            return new \WP_Error($errorCode, $errorMessage, ['status' => 500]);
        }

        return \rest_ensure_response([
            'success' => true,
            'project' => self::formatProject($term),
        ]);
    }

    /**
     * @return \WP_Error|null
     */
    private static function applyProjectFields(int $termId, \WP_REST_Request $request): ?\WP_Error
    {
        $args = [];
        $name = $request->get_param('name');
        if (\is_string($name) && $name !== '') {
            $args['name'] = \sanitize_text_field($name);
        }

        $description = $request->get_param('description');
        if (\is_string($description)) {
            $args['description'] = \sanitize_textarea_field($description);
        }

        if ($args === []) {
            return null;
        }

        $updated = \wp_update_term($termId, PostTypes::PROJECT_TAXONOMY, $args);
        return \is_wp_error($updated) ? $updated : null;
    }

    private static function applyProjectColor(int $termId, \WP_REST_Request $request): void
    {
        $color = $request->get_param('color');
        if (!\is_string($color)) {
            return;
        }

        $safeColor = \sanitize_hex_color($color);
        if ($safeColor) {
            \update_term_meta($termId, 'fd_project_color', $safeColor);
        }
    }

    /**
     * @return array<string, mixed>|null
     */
    private static function ensureDefaultProject(): ?array
    {
        $result = \wp_insert_term('My Tasks', PostTypes::PROJECT_TAXONOMY, [
            'description' => 'Default project',
        ]);

        if (\is_wp_error($result) || !isset($result['term_id'])) {
            return null;
        }

        $termId = (int) $result['term_id'];
        \update_term_meta($termId, 'fd_project_color', RestSupport::DEFAULT_PROJECT_COLOR);
        $term = \get_term($termId, PostTypes::PROJECT_TAXONOMY);

        return $term instanceof \WP_Term ? self::formatProject($term) : null;
    }
}
