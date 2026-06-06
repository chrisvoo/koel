<?php

namespace App\Http\Controllers\API\Alexa;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AlexaService;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class FetchAudioTokenController extends Controller
{
    /** @param User $user */
    public function __invoke(AlexaService $alexaService, Authenticatable $user): JsonResponse
    {
        abort_unless(AlexaService::enabled(), Response::HTTP_NOT_FOUND);

        return response()->json([
            'audio_token' => $alexaService->getAudioToken($user),
        ]);
    }
}
