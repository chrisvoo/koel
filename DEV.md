# Development notes

* Create a new file `.env.dev` and modify the values there according to your needs.
In particular `APP_URL` should match the development server to avoid cross origin errors.
* Modify the script dev inside `package.json` so that you pass through artisan the option `--env=dev`
* Vue files are stored in `resources/assets` directory
* When you're done, run `yarn install && yarn build`
* `git merge upstream/master`

## TODO:

* [X] Tweak FileSynchronizer class to use MediaInfo tool if the default ID3 fails. Need to
check how SongScanInformation is made by ID3 class
* [X] Change greeting returning total number of songs and size
* [X] alter table on proper class to update records for storing the following info:
  * `need_to_be_trimmed TINYINT(1) DEFAULT 0`: it needs a proper tool to delete the beginning or the end of the mp3 without losing quality
  * `need_metatag_update TINYINT(1) DEFAULT 0`: metatags are clearly wrong, need to edit them
