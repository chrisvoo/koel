<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Repositories\SongRepository;
use Illuminate\Http\JsonResponse;

class SystemStatsController extends Controller
{
    public function __invoke(SongRepository $songRepository): JsonResponse
    {
        return response()->json($songRepository->getAccessibleLibraryStats());
    }
}
