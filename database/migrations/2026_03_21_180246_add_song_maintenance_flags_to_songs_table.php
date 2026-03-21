<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('songs', static function (Blueprint $table): void {
            if (!Schema::hasColumn('songs', 'need_to_be_trimmed')) {
                $table->boolean('need_to_be_trimmed')->default(false);
            }

            if (!Schema::hasColumn('songs', 'need_metatag_update')) {
                $table->boolean('need_metatag_update')->default(false);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('songs', static function (Blueprint $table): void {
            if (Schema::hasColumn('songs', 'need_to_be_trimmed')) {
                $table->dropColumn('need_to_be_trimmed');
            }

            if (Schema::hasColumn('songs', 'need_metatag_update')) {
                $table->dropColumn('need_metatag_update');
            }
        });
    }
};
