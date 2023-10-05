MEDIA_PATH=/media/christian/Data/Music

inotifywait -rme move,close_write,delete --format "%e %w%f" $MEDIA_PATH | while read file; do
  php /var/www/koel/artisan koel:sync "${file}"
done
