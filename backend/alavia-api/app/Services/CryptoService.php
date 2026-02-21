<?php

namespace App\Services;

use RuntimeException;

class CryptoService
{
    private string $key;

    public function __construct()
    {
        $rawKey = (string) env('ENCRYPTION_KEY');
        if ($rawKey === '') {
            throw new RuntimeException('ENCRYPTION_KEY is not set.');
        }

        $this->key = hash('sha256', $rawKey, true);
    }

    public function encrypt(string $plainText): string
    {
        $ivLength = openssl_cipher_iv_length('AES-256-CBC');
        $iv = random_bytes($ivLength);
        $cipherText = openssl_encrypt(
            $plainText,
            'AES-256-CBC',
            $this->key,
            OPENSSL_RAW_DATA,
            $iv
        );

        if ($cipherText === false) {
            throw new RuntimeException('Encryption failed.');
        }

        return base64_encode($iv . $cipherText);
    }

    public function decrypt(string $payload): string
    {
        $raw = base64_decode($payload, true);
        if ($raw === false) {
            throw new RuntimeException('Invalid encrypted payload.');
        }

        $ivLength = openssl_cipher_iv_length('AES-256-CBC');
        $iv = substr($raw, 0, $ivLength);
        $cipherText = substr($raw, $ivLength);

        $plainText = openssl_decrypt(
            $cipherText,
            'AES-256-CBC',
            $this->key,
            OPENSSL_RAW_DATA,
            $iv
        );

        if ($plainText === false) {
            throw new RuntimeException('Decryption failed.');
        }

        return $plainText;
    }
}
