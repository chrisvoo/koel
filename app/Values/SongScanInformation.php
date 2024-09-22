<?php

namespace App\Values;

use App\Models\Album;
use App\Models\Artist;
use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Arr;
use Mhor\MediaInfo\Attribute\Duration;
use Mhor\MediaInfo\Attribute\Size;
use Mhor\MediaInfo\Type\General;

final class SongScanInformation implements Arrayable
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
        public ?int $mTime,
        public ?int $size
    ) {
    }

    public static function fromGetId3Info(array $info, string $path): self
    {
        // We prefer ID3v2 tags over ID3v1 tags.
        $tags = array_merge(
            Arr::get($info, 'tags.id3v1', []),
            Arr::get($info, 'tags.id3v2', []),
            Arr::get($info, 'comments', []),
        );

        $comments = Arr::get($info, 'comments', []);

        $albumArtistName = self::getTag($tags, ['albumartist', 'album_artist', 'band']);

        // If the song is explicitly marked as a compilation but there's no album artist name, use the umbrella
        // "Various Artists" artist.
        if (self::getTag($tags, 'part_of_a_compilation') && !$albumArtistName) {
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
            mTime: get_mtime($path),
            size: (int) Arr::get($info, 'filesize')
        );
    }

    private static function getTag(array $arr, string|array $keys, $default = ''): mixed
    {
        $keys = Arr::wrap($keys);

        for ($i = 0, $j = count($keys); $i < $j; ++$i) {
            $value = Arr::get($arr, $keys[$i] . '.0');

            if ($value) {
                break;
            }
        }

        return $value ?? $default;
    }

    private static function getYear(?string $date): ?int
    {
        if (is_null($date)) {
            return null;
        }

        if (is_numeric($date)) {
            return intval($date);
        }

        if (preg_match("/\d{4}\-\d{2}\-\d{2}/i", $date)) {
            return intval(substr($date, 0, 4));
        }

        return null;
    }

    public static function fromMediaInfo(General $general): self
    {
        $mediainfo = $general->get();
        /** @var Size $sizeObj */
        $sizeObj = $mediainfo['file_size'];
        /** @var Duration|int $duration */
        $duration = $mediainfo['duration'] ?? 0;
        $releaseDate = $mediainfo['original_released_date'] ?? $mediainfo['recorded_date'] ?? null;

        return new self(
            title: html_entity_decode($mediainfo['title'] ?? 'Unknown title'),
            albumName: html_entity_decode($mediainfo['album'] ?? Album::UNKNOWN_NAME),
            artistName: html_entity_decode($mediainfo['performer'] ?? $mediainfo['artists'] ?? Artist::UNKNOWN_NAME),
            albumArtistName: html_entity_decode($mediainfo['album_performer'] ?? 'Unknown album performer'),
            track: (int) ($mediainfo['track_name_position'] ?? 0),
            disc: (int) ($mediainfo['part_position'] ?? 0),
            year: self::getYear($releaseDate),
            genre: $mediainfo['genre'] ?? 'Unknown genre',
            lyrics: null,
            length: $duration instanceof Duration ? $duration->getMilliseconds() / 1000 : $duration,
            cover: [],
            path: $mediainfo['complete_name'],
            mTime: get_mtime($mediainfo['complete_name']),
            size: $sizeObj->getBit()
        );
    }

    /** @return array<mixed> */
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
            'mtime' => $this->mTime,
            'size' => $this->size,
        ];
    }
}
