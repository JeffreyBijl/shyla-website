<?php
// Kopieer dit bestand naar config.php op de TransIP-server
// (NIET committen — config.php staat in .gitignore)
//
// Vul de SMTP-gegevens in van de mailbox info@fitfoodbyshyla.nl
// (zie TransIP > Mailpakket > E-mail accounts)

return [
    'smtp_host'    => 'smtp.transip.email',
    'smtp_port'    => 587,
    'smtp_user'    => 'info@fitfoodbyshyla.nl',
    'smtp_pass'    => 'VERVANG_DOOR_MAILBOX_WACHTWOORD',

    'from_address' => 'info@fitfoodbyshyla.nl',
    'from_name'    => 'fit.foodbyshyla',
    'to_address'   => 'info@fitfoodbyshyla.nl',
];
