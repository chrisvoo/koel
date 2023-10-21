<?php

namespace App\Repositories;

use App\Models\Interaction;
use App\Models\User;
use App\Repositories\Traits\ByCurrentUser;
use Illuminate\Database\Eloquent\Builder;

class InteractionRepository extends Repository
{
    use ByCurrentUser;

    /** @return array<Interaction> */
    public function getRecentlyPlayed(User $user, ?int $count = null): array
    {
        return $this->model
            ->newQuery()
            ->where('user_id', $user->id)
            ->where('play_count', '>', 0)
            ->latest('last_played_at')
            ->when($count, static fn (Builder $query, int $count) => $query->take($count))
            ->pluck('song_id')
            ->all();
    }
}
