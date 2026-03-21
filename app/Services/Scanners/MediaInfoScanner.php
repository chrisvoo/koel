<?php

namespace App\Services\Scanners;

use App\Values\Scanning\ScanInformation;
use Mhor\MediaInfo\MediaInfo;
use Symfony\Component\Process\ExecutableFinder;
use Throwable;

class MediaInfoScanner
{
    private ?bool $binaryAvailable = null;

    public function isAvailable(): bool
    {
        if ($this->binaryAvailable !== null) {
            return $this->binaryAvailable;
        }

        $path = (new ExecutableFinder())->find(
            'mediainfo',
            null,
            [
                '/usr/local/bin',
                '/opt/homebrew/bin',
                '/usr/bin',
            ],
        );

        return $this->binaryAvailable = $path !== null && $path !== '';
    }

    public function tryScan(string $path): ?ScanInformation
    {
        if (!$this->isAvailable()) {
            return null;
        }

        try {
            $container = (new MediaInfo())->getInfo($path);
            $general = $container->getGeneral();

            if ($general === null) {
                return null;
            }

            return ScanInformation::fromMediaInfo($general, $path);
        } catch (Throwable) {
            return null;
        }
    }
}
