<?php

namespace Tests\Feature;

use App\Services\AlexaService;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

use function Tests\create_user;

class AlexaAccountLinkTest extends TestCase
{
    #[Test]
    public function showAuthorizePage(): void
    {
        config(['koel.alexa.enabled' => true]);

        $this->get('alexa/authorize?' . http_build_query([
            'client_id' => 'test-client',
            'response_type' => 'code',
            'state' => 'some-state',
            'redirect_uri' => 'https://alexa.amazon.com/callback',
        ]))
            ->assertOk()
            ->assertSee('Sign in')
            ->assertSee('Koel');
    }

    #[Test]
    public function authorizePageReturns404WhenDisabled(): void
    {
        config(['koel.alexa.enabled' => false]);

        $this->get('alexa/authorize?' . http_build_query([
            'client_id' => 'test-client',
            'response_type' => 'code',
            'state' => 'some-state',
            'redirect_uri' => 'https://alexa.amazon.com/callback',
        ]))
            ->assertNotFound();
    }

    #[Test]
    public function handleAuthorizeWithValidCredentials(): void
    {
        config(['koel.alexa.enabled' => true]);

        $user = create_user(['password' => bcrypt('secret')]);

        $response = $this->post('alexa/authorize', [
            '_token' => csrf_token(),
            'email' => $user->email,
            'password' => 'secret',
            'state' => 'some-state',
            'client_id' => 'test-client',
            'redirect_uri' => 'https://alexa.amazon.com/callback',
        ]);

        $response->assertRedirect();

        $location = $response->headers->get('Location');
        static::assertStringContainsString('https://alexa.amazon.com/callback', $location);
        static::assertStringContainsString('state=some-state', $location);
        static::assertStringContainsString('code=', $location);
    }

    #[Test]
    public function handleAuthorizeWithInvalidCredentials(): void
    {
        config(['koel.alexa.enabled' => true]);

        $user = create_user(['password' => bcrypt('secret')]);

        $this->post('alexa/authorize', [
            '_token' => csrf_token(),
            'email' => $user->email,
            'password' => 'wrong-password',
            'state' => 'some-state',
            'client_id' => 'test-client',
            'redirect_uri' => 'https://alexa.amazon.com/callback',
        ])
            ->assertUnauthorized();
    }

    #[Test]
    public function exchangeAuthorizationCodeForToken(): void
    {
        config(['koel.alexa.enabled' => true]);

        $user = create_user();
        $alexaService = app(AlexaService::class);
        $code = $alexaService->generateAuthorizationCode($user, 'test-state');

        $this->post('alexa/token', [
            'grant_type' => 'authorization_code',
            'code' => $code,
        ])
            ->assertOk()
            ->assertJsonStructure(['access_token', 'token_type'])
            ->assertJsonFragment(['token_type' => 'Bearer']);
    }

    #[Test]
    public function exchangeInvalidCodeReturnsBadRequest(): void
    {
        config(['koel.alexa.enabled' => true]);

        $this->post('alexa/token', [
            'grant_type' => 'authorization_code',
            'code' => 'invalid-code',
        ])
            ->assertBadRequest();
    }

    #[Test]
    public function tokenEndpointReturns404WhenDisabled(): void
    {
        config(['koel.alexa.enabled' => false]);

        $this->post('alexa/token', [
            'grant_type' => 'authorization_code',
            'code' => 'any-code',
        ])
            ->assertNotFound();
    }
}
