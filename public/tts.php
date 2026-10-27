<?php
/**
 * Lee en voz alta las cartas que llevan nombres de jugadores (las demás ya van grabadas en /audio).
 * Pide el audio a Google Text-to-Speech con la clave que solo vive en el servidor.
 *
 * Para que nunca cueste dinero:
 *  - Guarda cada frase generada y no la vuelve a pedir.
 *  - Lleva la cuenta de caracteres del mes y se para antes del límite gratuito (la app usa entonces la voz del móvil).
 *  - Limita las peticiones por persona y hora.
 *
 * Configuración: tts-config.php en la carpeta del proyecto (fuera de dist/), que no se sube a git:
 *   <?php return ['key' => 'CLAVE_DE_GOOGLE', 'voice' => 'es-ES-Chirp3-HD-Laomedeia'];
 */

const MONTHLY_CAP = 900000;   // caracteres al mes (Google regala 1.000.000)
const MAX_TEXT = 300;         // ninguna carta es tan larga
const PER_IP_PER_HOUR = 120;  // una partida intensa no llega ni a 30
const ALLOWED_ORIGINS = ['https://padentro.pablovaldazo.es', 'capacitor://localhost', 'https://localhost'];

function fail(int $code, string $msg) {
    http_response_code($code);
    header('Content-Type: text/plain; charset=utf-8');
    exit($msg);
}

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, ALLOWED_ORIGINS, true)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Vary: Origin');
}

$configFile = dirname(__DIR__) . '/tts-config.php';
if (!is_file($configFile)) fail(503, 'Sin configurar');
$config = require $configFile;
$key = $config['key'] ?? '';
$voice = $config['voice'] ?? 'es-ES-Chirp3-HD-Laomedeia';
if (!$key) fail(503, 'Sin clave');

$text = trim((string)($_GET['t'] ?? ''));
if ($text === '' || mb_strlen($text) > MAX_TEXT) fail(400, 'Texto no válido');

$dir = dirname(__DIR__) . '/tts-cache';
if (!is_dir($dir) && !mkdir($dir, 0770, true)) fail(500, 'Sin carpeta de caché');

function sendAudio(string $file) {
    header('Content-Type: audio/mpeg');
    header('Cache-Control: public, max-age=31536000, immutable');
    header('Content-Length: ' . filesize($file));
    readfile($file);
    exit;
}

// 1. Si ya se generó, se sirve sin gastar nada.
$cached = "$dir/" . sha1($voice . '|' . $text) . '.mp3';
if (is_file($cached)) sendAudio($cached);

// 2. Límite por persona y hora (y, de vez en cuando, borrar los contadores viejos).
if (mt_rand(1, 50) === 1) {
    foreach (glob("$dir/ip-*.txt") as $f) if (filemtime($f) < time() - 7200) @unlink($f);
}
$ipFile = "$dir/ip-" . sha1(($_SERVER['REMOTE_ADDR'] ?? '') . date('YmdH')) . '.txt';
$hits = (int)@file_get_contents($ipFile) + 1;
file_put_contents($ipFile, (string)$hits);
if ($hits > PER_IP_PER_HOUR) fail(429, 'Demasiadas peticiones');

// 3. Tope mensual, con bloqueo para que dos peticiones a la vez no se lo salten.
$chars = mb_strlen($text);
$usage = fopen("$dir/usage-" . date('Y-m') . '.txt', 'c+');
flock($usage, LOCK_EX);
$used = (int)stream_get_contents($usage);
if ($used + $chars > MONTHLY_CAP) {
    flock($usage, LOCK_UN);
    fail(503, 'Límite del mes alcanzado');
}
ftruncate($usage, 0);
rewind($usage);
fwrite($usage, (string)($used + $chars));
flock($usage, LOCK_UN);
fclose($usage);

// 4. Pedir el audio a Google.
$ch = curl_init("https://texttospeech.googleapis.com/v1/text:synthesize?key=$key");
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 15,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS => json_encode([
        'input' => ['text' => $text],
        'voice' => ['languageCode' => 'es-ES', 'name' => $voice],
        'audioConfig' => ['audioEncoding' => 'MP3'],
    ]),
]);
$res = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
$audio = $status === 200 ? base64_decode(json_decode($res, true)['audioContent'] ?? '') : '';
if (!$audio) fail(502, 'Google no ha devuelto audio');

file_put_contents($cached, $audio);
sendAudio($cached);
