<?php

namespace App\Services;

use App\Models\Interaction;
use App\Models\User;

class InteractionService
{
    /**
     * Increase the number of times a song is played by a user.
     *
     * @return Interaction The affected Interaction object
     */
    public function increasePlayCount(string $songId, User $user): Interaction
    {
        return tap(Interaction::query()->firstOrCreate([
            'song_id' => $songId,
            'user_id' => $user->id,
        ]), static function (Interaction $interaction): void {
            $interaction->last_played_at = now();
            ++$interaction->play_count;
            $interaction->save();
        });
    }
}
