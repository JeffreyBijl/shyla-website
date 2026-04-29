<?php
// Kopieer dit bestand naar config.php op de TransIP-server
// (NIET committen — config.php staat in .gitignore)

return [
    // Verzendmethode: 'smtp' of 'mail'
    //   'smtp' = via PHPMailer met SMTP-auth (vereist credentials hieronder)
    //   'mail' = via PHP mail() (interne mailrelay van TransIP, geen credentials nodig)
    'method'       => 'smtp',

    // Debug-modus: true = errors uitgebreid in API-response (zet UIT op productie!)
    'debug'        => false,

    // SMTP-instellingen (alleen gebruikt als method = 'smtp')
    'smtp_host'    => 'smtp.transip.email',
    'smtp_port'    => 465,            // 465 voor SSL/SMTPS, 587 voor STARTTLS
    'smtp_secure'  => 'ssl',          // 'ssl' (poort 465) of 'tls' (poort 587)
    'smtp_user'    => 'info@fitfoodbyshyla.nl',
    'smtp_pass'    => 'VERVANG_DOOR_MAILBOX_WACHTWOORD',
    'smtp_timeout' => 10,             // seconden voor TCP-connect

    // Afzender en ontvanger (gebruikt voor beide methodes)
    'from_address' => 'info@fitfoodbyshyla.nl',
    'from_name'    => 'fit.foodbyshyla',
    'to_address'   => 'info@fitfoodbyshyla.nl',
];
