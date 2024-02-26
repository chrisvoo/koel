<?php

namespace App\Providers;

use App\Events\LibraryChanged;
use App\Events\MediaSyncCompleted;
use App\Events\PlaybackStarted;
use App\Listeners\ClearMediaCache;
use App\Listeners\DeleteNonExistingRecordsPostSync;
use App\Listeners\PruneLibrary;
use App\Listeners\UpdateLastfmNowPlaying;
use App\Listeners\WriteSyncLog;
use App\Models\Album;
use App\Observers\AlbumObserver;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as BaseServiceProvider;

class EventServiceProvider extends BaseServiceProvider
{
    protected $listen = [
        PlaybackStarted::class => [
            UpdateLastfmNowPlaying::class,
        ],

        LibraryChanged::class => [
            PruneLibrary::class,
            ClearMediaCache::class,
        ],

        MediaSyncCompleted::class => [
            DeleteNonExistingRecordsPostSync::class,
            WriteSyncLog::class,
        ],
    ];

    public function boot(): void
    {
        parent::boot();

        Album::observe(AlbumObserver::class);
    }
}
