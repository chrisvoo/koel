<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        /*Schema::table('playlist_song', static function (Blueprint $table): void {
            $table->unsignedInteger('position')->index()->default(0);
        });*/

        DB::table('playlists')->orderBy('id')->chunk(100, static function ($playlists): void {
            foreach ($playlists as $playlist) {
                /*
                 update `playlist_song` set `position` = (SELECT COUNT(id)
                            FROM playlist_song p
                            WHERE p.playlist_id = '0eb9c107-0f32-4bbb-9574-67e26cbf0764'
                            AND p.id <= playlist_song.id) where `playlist_id` = 0eb9c107-0f32-4bbb-9574-67e26cbf0764)
                 */
                DB::table('playlist_song')
                    ->where('playlist_id', $playlist->id)
                    ->update([
                        'position' => DB::raw("(SELECT count FROM (SELECT COUNT(id) AS count
                            FROM playlist_song p
                            WHERE p.playlist_id = '$playlist->id'
                            AND p.id <= playlist_song.id) c)"),
                    ]);
            }
        });
    }
};
