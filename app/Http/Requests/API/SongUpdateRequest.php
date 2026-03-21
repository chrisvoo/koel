<?php

namespace App\Http\Requests\API;

use App\Models\Song;
use App\Values\Song\SongUpdateData;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;

/**
 * @property-read array<string> $songs
 * @property-read array<mixed> $data
 */
class SongUpdateRequest extends Request
{
    /** @inheritdoc */
    public function rules(): array
    {
        return [
            'data' => 'required|array',
            'data.need_to_be_trimmed' => ['sometimes', 'boolean'],
            'data.need_metatag_update' => ['sometimes', 'boolean'],
            'songs' => ['required', 'array', Rule::exists(Song::class, 'id')->whereNull('podcast_id')],
        ];
    }

    public function toDto(): SongUpdateData
    {
        $payload = $this->input('data', []);

        return SongUpdateData::make(
            title: $this->input('data.title'),
            artistName: $this->input('data.artist_name'),
            albumName: $this->input('data.album_name'),
            albumArtistName: $this->input('data.album_artist_name'),
            track: (int) $this->input('data.track'),
            disc: (int) $this->input('data.disc'),
            genre: $this->input('data.genre'),
            year: (int) $this->input('data.year'),
            lyrics: $this->input('data.lyrics'),
            needToBeTrimmed: Arr::has($payload, 'need_to_be_trimmed') ? (bool) $payload['need_to_be_trimmed'] : null,
            needMetatagUpdate: Arr::has($payload, 'need_metatag_update')
                ? (bool) $payload['need_metatag_update']
                : null,
        );
    }
}
