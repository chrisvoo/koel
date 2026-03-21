<?php

namespace App\Values\Scanning;

use App\Models\Album;
use App\Models\Artist;
use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Mhor\MediaInfo\Attribute\Duration;
use Mhor\MediaInfo\Attribute\Size;
use Mhor\MediaInfo\Type\General;

class ScanInformation implements Arrayable
{
    private function __construct(
        public ?string $title,
        public ?string $albumName,
        public ?string $artistName,
        public ?string $albumArtistName,
        public ?int $track,
        public ?int $disc,
        public ?int $year,
        public ?string $genre,
        public ?string $lyrics,
        public ?float $length,
        public ?array $cover,
        public ?string $path,
        public ?string $hash,
        public ?int $mTime,
        public ?string $mimeType,
        public ?int $fileSize,
    ) {}

    public static function fromGetId3Info(array $info, string $path): self
    {
        // We prefer ID3v2 tags over ID3v1 tags.
        $tags = array_merge(
            Arr::get($info, 'tags.id3v1', []),
            Arr::get($info, 'tags.id3v2', []),
            Arr::get($info, 'comments', []),
            Arr::get($info, 'tags.vorbiscomment', []),
        );

        $comments = Arr::get($info, 'comments', []);

        $albumArtistName = self::getTag($tags, ['albumartist', 'album_artist', 'band']);

        // If the song is explicitly marked as a compilation but there's no album artist name, use the umbrella
        // "Various Artists" artist.
        if (!$albumArtistName && self::getTag($tags, 'part_of_a_compilation')) {
            $albumArtistName = Artist::VARIOUS_NAME;
        }

        $cover = [self::getTag($comments, 'cover', null)];

        if ($cover[0] === null) {
            $cover = self::getTag($comments, 'picture', []);
        }

        $lyrics = html_entity_decode(self::getTag($tags, [
            'unsynchronised_lyric',
            'unsychronised_lyric',
            'unsyncedlyrics',
            'lyrics',
        ]));

        return new self(
            title: html_entity_decode(self::getTag($tags, 'title', pathinfo($path, PATHINFO_FILENAME))),
            albumName: html_entity_decode(self::getTag($tags, 'album', Album::UNKNOWN_NAME)),
            artistName: html_entity_decode(self::getTag($tags, 'artist', Artist::UNKNOWN_NAME)),
            albumArtistName: html_entity_decode($albumArtistName),
            track: (int) self::getTag($tags, ['track', 'tracknumber', 'track_number']),
            disc: (int) self::getTag($tags, ['discnumber', 'part_of_a_set'], 1),
            year: (int) self::getTag($tags, 'year') ?: null,
            genre: self::getTag($tags, 'genre'),
            lyrics: $lyrics,
            length: (float) Arr::get($info, 'playtime_seconds'),
            cover: $cover,
            path: $path,
            hash: File::hash($path),
            mTime: get_mtime($path),
            mimeType: Str::lower(Arr::get($info, 'mime_type')) ?: 'audio/mpeg',
            fileSize: File::size($path),
        );
    }

    public static function make(
        ?string $title = null,
        ?string $albumName = null,
        ?string $artistName = null,
        ?string $albumArtistName = null,
        ?int $track = null,
        ?int $disc = null,
        ?int $year = null,
        ?string $genre = null,
        ?string $lyrics = null,
        ?float $length = null,
        ?array $cover = null,
        ?string $path = null,
        ?string $hash = null,
        ?int $mTime = null,
        ?string $mimeType = null,
        ?int $fileSize = null,
    ): self {
        return new self(
            title: $title,
            albumName: $albumName,
            artistName: $artistName,
            albumArtistName: $albumArtistName,
            track: $track,
            disc: $disc,
            year: $year,
            genre: $genre,
            lyrics: $lyrics,
            length: $length,
            cover: $cover,
            path: $path,
            hash: $hash,
            mTime: $mTime,
            mimeType: $mimeType,
            fileSize: $fileSize,
        );
    }

    private static function getTag(array $arr, string|array $keys, $default = ''): mixed
    {
        foreach (Arr::wrap($keys) as $name) {
            $value = Arr::get($arr, $name . '.0');

            if ($value) {
                break;
            }
        }

        return $value ?? $default;
    }

    public static function fromMediaInfo(General $general, string $path): self
    {
        /** @var array<string, mixed> $mediainfo */
        $mediainfo = $general->get();

        $fileSize = null;
        $sizeAttr = $mediainfo['file_size'] ?? null;

        if ($sizeAttr instanceof Size) {
            $fileSize = $sizeAttr->getBit();
        }

        if (!$fileSize && File::exists($path)) {
            $fileSize = File::size($path);
        }

        $durationRaw = $mediainfo['duration'] ?? 0;
        $length = 0.0;

        if ($durationRaw instanceof Duration) {
            $length = $durationRaw->getMilliseconds() / 1000;
        } elseif (is_numeric($durationRaw)) {
            $length = (float) $durationRaw;
        }

        $releaseDate = $mediainfo['original_released_date'] ?? $mediainfo['recorded_date'] ?? null;
        $year = self::yearFromMediaInfoDate($releaseDate);

        $performer = $mediainfo['performer'] ?? $mediainfo['artists'] ?? $mediainfo['artist'] ?? '';
        $artistName = html_entity_decode(self::stringifyMediaInfoValue($performer) ?: Artist::UNKNOWN_NAME);

        $albumPerformer = $mediainfo['album_performer'] ?? '';
        $albumArtistName = html_entity_decode(self::stringifyMediaInfoValue($albumPerformer) ?: Artist::UNKNOWN_NAME);

        $titleRaw = $mediainfo['title'] ?? pathinfo($path, PATHINFO_FILENAME);
        $genreRaw = $mediainfo['genre'] ?? '';

        $track = (int) ($mediainfo['track_name_position'] ?? 0);
        $disc = (int) ($mediainfo['part_position'] ?? 0);

        if ($disc === 0) {
            $disc = 1;
        }

        $mimeType = Str::lower(self::stringifyMediaInfoValue($mediainfo['internet_media_type'] ?? '')) ?: 'audio/mpeg';

        return new self(
            title: html_entity_decode(self::stringifyMediaInfoValue($titleRaw) ?: pathinfo($path, PATHINFO_FILENAME)),
            albumName: html_entity_decode(
                self::stringifyMediaInfoValue($mediainfo['album'] ?? '') ?: Album::UNKNOWN_NAME,
            ),
            artistName: $artistName,
            albumArtistName: $albumArtistName,
            track: $track,
            disc: $disc,
            year: $year,
            genre: self::stringifyMediaInfoValue($genreRaw),
            lyrics: null,
            length: $length,
            cover: [],
            path: $path,
            hash: File::hash($path),
            mTime: get_mtime($path),
            mimeType: $mimeType,
            fileSize: $fileSize,
        );
    }

    private static function stringifyMediaInfoValue(mixed $value): string
    {
        if ($value === null) {
            return '';
        }

        if (is_string($value)) {
            return $value;
        }

        if (is_object($value) && method_exists($value, '__toString')) {
            return (string) $value;
        }

        if (is_scalar($value)) {
            return (string) $value;
        }

        return '';
    }

    private static function yearFromMediaInfoDate(mixed $date): ?int
    {
        if ($date === null) {
            return null;
        }

        $str = self::stringifyMediaInfoValue($date);

        if ($str === '') {
            return null;
        }

        if (is_numeric($str)) {
            return (int) $str;
        }

        if (preg_match('/\d{4}-\d{2}-\d{2}/', $str)) {
            return (int) substr($str, 0, 4);
        }

        return null;
    }

    /** @inheritdoc */
    public function toArray(): array
    {
        return [
            'title' => $this->title,
            'album' => $this->albumName,
            'artist' => $this->artistName,
            'albumartist' => $this->albumArtistName,
            'track' => $this->track,
            'disc' => $this->disc,
            'year' => $this->year,
            'genre' => $this->genre,
            'lyrics' => $this->lyrics,
            'length' => $this->length,
            'cover' => $this->cover,
            'path' => $this->path,
            'hash' => $this->hash,
            'mtime' => $this->mTime,
            'mime_type' => $this->mimeType,
            'file_size' => $this->fileSize,
        ];
    }
}
