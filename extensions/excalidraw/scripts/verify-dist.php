<?php
/**
 * Ensures Vite production output exists before packaging or deploy.
 */

declare(strict_types=1);

$distEditor = dirname(__DIR__) . '/dist/pages/editor.html';

if (!is_file($distEditor)) {
    fwrite(
        STDERR,
        "Missing build output: dist/pages/editor.html\nRun: composer run build\n",
    );
    exit(1);
}

fwrite(STDOUT, "OK: dist/pages/editor.html\n");
exit(0);
