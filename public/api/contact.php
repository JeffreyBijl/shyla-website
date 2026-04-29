<?php
declare(strict_types=1);

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

require __DIR__ . '/PHPMailer/Exception.php';
require __DIR__ . '/PHPMailer/PHPMailer.php';
require __DIR__ . '/PHPMailer/SMTP.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

$configFile = __DIR__ . '/config.php';
if (!file_exists($configFile)) {
    http_response_code(500);
    error_log('contact.php: config.php ontbreekt');
    echo json_encode(['ok' => false, 'error' => 'Server is nog niet geconfigureerd.']);
    exit;
}
$config = require $configFile;

$name    = trim((string)($_POST['name']    ?? ''));
$email   = trim((string)($_POST['email']   ?? ''));
$subject = trim((string)($_POST['subject'] ?? ''));
$message = trim((string)($_POST['message'] ?? ''));
$honey   = trim((string)($_POST['website'] ?? ''));

if ($honey !== '') {
    echo json_encode(['ok' => true]);
    exit;
}

$errors = [];
if ($name === '' || mb_strlen($name) > 100) {
    $errors[] = 'Vul een geldige naam in.';
}
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 200) {
    $errors[] = 'Vul een geldig e-mailadres in.';
}
if (mb_strlen($subject) > 200) {
    $errors[] = 'Onderwerp is te lang.';
}
if ($message === '' || mb_strlen($message) > 5000) {
    $errors[] = 'Vul een bericht in (max 5000 tekens).';
}

if ($errors) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => implode(' ', $errors)]);
    exit;
}

$mail = new PHPMailer(true);
try {
    $mail->isSMTP();
    $mail->Host       = $config['smtp_host'];
    $mail->SMTPAuth   = true;
    $mail->Username   = $config['smtp_user'];
    $mail->Password   = $config['smtp_pass'];
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = (int)($config['smtp_port'] ?? 587);
    $mail->CharSet    = 'UTF-8';

    $mail->setFrom($config['from_address'], $config['from_name'] ?? 'fit.foodbyshyla');
    $mail->addAddress($config['to_address']);
    $mail->addReplyTo($email, $name);

    $mail->Subject = $subject !== ''
        ? '[Contactformulier] ' . $subject
        : '[Contactformulier] Nieuw bericht van ' . $name;

    $bodyText = "Nieuw contactformulier-bericht\n\n"
        . "Naam:       $name\n"
        . "E-mail:     $email\n"
        . "Onderwerp:  " . ($subject !== '' ? $subject : '(geen)') . "\n\n"
        . "Bericht:\n$message\n";

    $mail->isHTML(false);
    $mail->Body = $bodyText;

    $mail->send();

    echo json_encode(['ok' => true]);
} catch (Exception $e) {
    http_response_code(500);
    error_log('contact.php mail error: ' . $mail->ErrorInfo);
    echo json_encode(['ok' => false, 'error' => 'Bericht kon niet worden verzonden. Probeer het later opnieuw.']);
}
