# Open, queue or notify

**open** (default): the file opens in a tab without taking focus, so language servers check it right away. OpenFiles waits if you're typing and stops after `openfiles.maxAutoOpen` files.

**queue**: nothing opens. Files are listed in the AI Edits view and you open them when you're ready. Note that most linters won't check a file until it's open.

**notify**: a small notification with an Open button.

You can switch any time from the status bar menu.
