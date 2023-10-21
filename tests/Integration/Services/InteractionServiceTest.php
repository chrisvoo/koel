<?php

namespace Tests\Integration\Services;

use App\Models\Interaction;
use App\Services\InteractionService;
use Tests\TestCase;

class InteractionServiceTest extends TestCase
{
    private InteractionService $interactionService;

    public function setUp(): void
    {
        parent::setUp();

        $this->interactionService = new InteractionService();
    }

    public function testIncreasePlayCount(): void
    {
        /** @var Interaction $interaction */
        $interaction = Interaction::factory()->create();
        $currentCount = $interaction->play_count;
        $this->interactionService->increasePlayCount($interaction->song, $interaction->user);

        self::assertSame($currentCount + 1, $interaction->refresh()->play_count);
    }
}
