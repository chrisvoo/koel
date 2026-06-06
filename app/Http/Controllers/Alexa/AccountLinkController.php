<?php

namespace App\Http\Controllers\Alexa;

use App\Http\Controllers\Controller;
use App\Services\AlexaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\View\View;

class AccountLinkController extends Controller
{
    public function __construct(private readonly AlexaService $alexaService) {}

    public function showAuthorize(Request $request): View|Response
    {
        abort_unless(AlexaService::enabled(), Response::HTTP_NOT_FOUND);

        $request->validate([
            'client_id' => 'required|string',
            'response_type' => 'required|in:code',
            'state' => 'required|string',
            'redirect_uri' => 'required|url',
        ]);

        return view('alexa.authorize', [
            'state' => $request->input('state'),
            'client_id' => $request->input('client_id'),
            'redirect_uri' => $request->input('redirect_uri'),
        ]);
    }

    public function handleAuthorize(Request $request): Response|RedirectResponse
    {
        abort_unless(AlexaService::enabled(), Response::HTTP_NOT_FOUND);

        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
            'state' => 'required|string',
            'redirect_uri' => 'required|url',
        ]);

        $user = $this->alexaService->authenticateUser($request->input('email'), $request->input('password'));

        if (!$user) {
            return response(view('alexa.authorize', [
                'state' => $request->input('state'),
                'client_id' => $request->input('client_id'),
                'redirect_uri' => $request->input('redirect_uri'),
                'error' => __('auth.failed'),
            ]), Response::HTTP_UNAUTHORIZED);
        }

        $code = $this->alexaService->generateAuthorizationCode($user, $request->input('state'));
        $redirectUri = $request->input('redirect_uri');

        return response()->redirectTo(
            sprintf('%s?state=%s&code=%s', $redirectUri, urlencode($request->input('state')), urlencode($code))
        );
    }

    public function token(Request $request): JsonResponse
    {
        abort_unless(AlexaService::enabled(), Response::HTTP_NOT_FOUND);

        $request->validate([
            'grant_type' => 'required|in:authorization_code',
            'code' => 'required|string',
        ]);

        $compositeToken = $this->alexaService->exchangeAuthorizationCode($request->input('code'));

        if (!$compositeToken) {
            return response()->json(['error' => 'invalid_grant'], Response::HTTP_BAD_REQUEST);
        }

        return response()->json([
            'access_token' => $compositeToken->apiToken,
            'token_type' => 'Bearer',
            'expires_in' => 0,
        ]);
    }
}
