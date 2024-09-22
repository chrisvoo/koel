<?php

namespace App\Values;

use App\Http\Requests\API\SongUpdateRequest;
use Illuminate\Contracts\Support\Arrayable;

final class SongUpdateData implements Arrayable
{
    private function __construct(
        public ?string $title,
        public ?string $artistName,
        public ?string $albumName,
        public ?string $albumArtistName,
        public ?int $track,
        public ?int $disc,
        public ?string $genre,
        public ?int $year,
        public ?string $lyrics,
        public ?bool $needToBeTrimmed,
        public ?bool $needToUpdateMetatags
    ) {
        $this->albumArtistName = $this->albumArtistName ?: $this->artistName;
    }

    public static function fromRequest(SongUpdateRequest $request): self
    {
        return new self(
            title: $request->input('data.title'),
            artistName: $request->input('data.artist_name'),
            albumName: $request->input('data.album_name'),
            albumArtistName: $request->input('data.album_artist_name'),
            track: (int) $request->input('data.track'),
            disc: (int) $request->input('data.disc'),
            genre: $request->input('data.genre'),
            year: (int) $request->input('data.year'),
            lyrics: $request->input('data.lyrics'),
            needToBeTrimmed: $request->input('data.need_to_be_trimmed'),
            needToUpdateMetatags: $request->input('data.need_metatag_update'),
        );
    }

    public static function make(
        ?string $title,
        ?string $artistName,
        ?string $albumName,
        ?string $albumArtistName,
        ?int $track,
        ?int $disc,
        ?string $genre,
        ?int $year,
        ?string $lyrics,
        ?bool $needToBeTrimmed,
        ?bool $needToUpdateMetatags,
    ): self {
        return new self(
            $title,
            $artistName,
            $albumName,
            $albumArtistName,
            $track,
            $disc,
            $genre,
            $year,
            $lyrics,
            $needToBeTrimmed,
            $needToUpdateMetatags
        );
    }

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'title' => $this->title,
            'artist' => $this->artistName,
            'album' => $this->albumName,
            'album_artist' => $this->albumArtistName,
            'track' => $this->track,
            'disc' => $this->disc,
            'genre' => $this->genre,
            'year' => $this->year,
            'lyrics' => $this->lyrics,
            'need_to_be_trimmed' => $this->needToBeTrimmed,
            'need_metatag_update' => $this->needToUpdateMetatags,
        ];
    }
}
