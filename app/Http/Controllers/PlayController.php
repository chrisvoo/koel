<?php

namespace App\Http\Controllers;

use App\Factories\StreamerFactory;
use App\Http\Requests\SongPlayRequest;
use App\Models\Song;
use Illuminate\Support\Facades\Log;
use Throwable;

class PlayController extends Controller
{
    public function __construct(private StreamerFactory $streamerFactory)
    {
    }

    public function show(SongPlayRequest $request, Song $song, ?bool $transcode = null, ?int $bitRate = null)
    {
        try {
            return $this->streamerFactory
                ->createStreamer($song, $transcode, $bitRate, (float)$request->time)
                ->stream();
        } catch (Throwable $e) {
            Log::error($e->getMessage() . ": " . $e->getTraceAsString(), [
                __FILE__ . __METHOD__,
            ]);
        }
    }
}
