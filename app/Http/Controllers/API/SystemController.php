<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Repositories\SongRepository;
use Illuminate\Http\Resources\Json\JsonResource;

class SystemController extends Controller
{
    public function __construct(
        private SongRepository $songRepository
    ) {
    }

    public function index()
    {
        $stats = $this->songRepository->getSongsStats();
        return JsonResource::make((array)$stats)->response();
    }
}
