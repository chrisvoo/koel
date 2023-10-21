<?php

namespace Tests\Feature;

use App\Models\Song;
use App\Models\User;

class InteractionTest extends TestCase
{
    public function setUp(): void
    {
        parent::setUp();

        static::createSampleMediaSet();
    }

    public function testIncreasePlayCount(): void
    {
        $this->withoutEvents();

        /** @var User $user */
        $user = User::factory()->create();

        /** @var Song $song */
        $song = Song::query()->orderBy('id')->first();
        $this->postAs('api/interaction/play', ['song' => $song->id], $user);

        self::assertDatabaseHas('interactions', [
            'user_id' => $user->id,
            'song_id' => $song->id,
            'play_count' => 1,
        ]);

        // Try again
        $this->postAs('api/interaction/play', ['song' => $song->id], $user);

        self::assertDatabaseHas('interactions', [
            'user_id' => $user->id,
            'song_id' => $song->id,
            'play_count' => 2,
        ]);
    }
}
