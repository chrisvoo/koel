<?php

namespace Tests\Feature;

use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

use function Tests\create_user;

class AlexaAudioTokenTest extends TestCase
{
    #[Test]
    public function fetchAudioToken(): void
    {
        config(['koel.alexa.enabled' => true]);

        $user = create_user();

        $this->getAs('api/alexa/audio-token', $user)
            ->assertOk()
            ->assertJsonStructure(['audio_token']);
    }

    #[Test]
    public function fetchAudioTokenRequiresAuthentication(): void
    {
        config(['koel.alexa.enabled' => true]);

        $this->json('get', 'api/alexa/audio-token')
            ->assertUnauthorized();
    }

    #[Test]
    public function fetchAudioTokenReturns404WhenDisabled(): void
    {
        config(['koel.alexa.enabled' => false]);

        $user = create_user();

        $this->getAs('api/alexa/audio-token', $user)
            ->assertNotFound();
    }
}
