<?php

namespace App\Services;

use App\Models\User;
use App\Repositories\UserRepository;
use App\Values\CompositeToken;
use Illuminate\Container\Attributes\Config;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use SensitiveParameter;

class AlexaService
{
    public function __construct(
        private readonly TokenManager $tokenManager,
        private readonly UserRepository $userRepository,
        #[Config('koel.alexa.enabled')]
        private readonly bool $enabled = false,
        #[Config('koel.alexa.skill_id')]
        private readonly ?string $skillId = null,
    ) {}

    public static function enabled(): bool
    {
        return (bool) config('koel.alexa.enabled');
    }

    public function generateAuthorizationCode(User $user, string $state): string
    {
        $code = bin2hex(random_bytes(20));

        Cache::put(
            $this->authCodeCacheKey($code),
            encrypt(['user_id' => $user->id, 'state' => $state]),
            now()->addMinutes(10),
        );

        return $code;
    }

    public function exchangeAuthorizationCode(#[SensitiveParameter] string $code): ?CompositeToken
    {
        $cacheKey = $this->authCodeCacheKey($code);
        $encrypted = Cache::pull($cacheKey);

        if (!$encrypted) {
            return null;
        }

        $data = decrypt($encrypted);
        $user = $this->userRepository->getOne($data['user_id']);

        return $this->tokenManager->createCompositeToken($user);
    }

    public function getAudioToken(User $user): string
    {
        $compositeToken = $this->tokenManager->createCompositeToken($user);

        return $compositeToken->audioToken;
    }

    public function authenticateUser(string $email, #[SensitiveParameter] string $password): ?User
    {
        $user = $this->userRepository->findFirstWhere('email', $email);

        if (!$user || !Hash::check($password, $user->password)) {
            return null;
        }

        return $user;
    }

    private function authCodeCacheKey(string $code): string
    {
        return "alexa.auth-code.$code";
    }
}
