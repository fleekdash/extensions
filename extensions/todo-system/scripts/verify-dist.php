<?php
/**
 * Ensures Vite production output exists before packaging or deploy.
 */

declare(strict_types=1);

$distRoot = dirname(__DIR__) . '/dist';
$required = ['dist/pages/app.html', 'dist/pages/api-demo.html'];
$missing = array_filter(
    $required,
    static fn (string $file): bool => !is_file(dirname(__DIR__) . '/' . $file),
);

if ($missing !== [] || !is_dir($distRoot . '/assets')) {
    fwrite(
        STDERR,
        "Missing build output: " . implode(', ', $missing ?: ['dist/assets/']) .
            "\nRun: pnpm run build\n",
    );
    exit(1);
}

fwrite(STDOUT, "OK: " . implode(', ', $required) . "\n");
exit(0);
