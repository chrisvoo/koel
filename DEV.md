# Development notes

* Create a new file `.env.dev` and modify the values there according to your needs.
In particular `APP_URL` should match the development server to avoid cross origin errors.
* Modify the script dev inside `package.json` so that you pass through artisan the option `--env=dev`
* Vue files are stored in `resources/assets` directory
* When you're done, run `npm run build`
