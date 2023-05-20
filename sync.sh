MEDIA_PATH=/media/christian/Data/Musica/
PHP_BIN=/usr/bin/php

inotifywait -rme move,close_write,delete --format "%e %w%f" $MEDIA_PATH | while read file; do
  $PHP_BIN artisan koel:sync "${file}"
done
