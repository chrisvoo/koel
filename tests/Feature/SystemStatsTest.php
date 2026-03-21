<?php

namespace Tests\Feature;

use App\Models\Song;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

use function Tests\create_user;

class SystemStatsTest extends TestCase
{
    #[Test]
    public function returnsAccessibleLibraryStats(): void
    {
        $user = create_user();
        Song::factory()->create(['file_size' => 1000]);
        Song::factory()->create(['file_size' => 2000]);

        $this
            ->getAs('api/system-stats', $user)
            ->assertOk()
            ->assertJson([
                'total_songs' => 2,
                'total_size' => 3000,
            ]);
    }
}
