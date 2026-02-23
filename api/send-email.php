<?php


header('Content-Type: application/json');

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Get JSON data from request body
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// Validate required fields (subject is optional)
if (!isset($data['name']) || !isset($data['email']) || !isset($data['message'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Missing required fields',
        'received' => [
            'name'    => isset($data['name']),
            'email'   => isset($data['email']),
            'message' => isset($data['message'])
        ]
    ]);
    exit();
}

$name    = htmlspecialchars(trim($data['name']));
$email   = htmlspecialchars(trim($data['email']));
$subject = isset($data['subject']) ? htmlspecialchars(trim($data['subject'])) : '(No subject)';
$message = htmlspecialchars(trim($data['message']));

// Validate email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Invalid email address'
    ]);
    exit();
}

// Recipient
$recipient    = 'contact@johnathankemp.org';
$emailSubject = "[{$subject}] Message from {$name}";

// Email body
$emailBody = "
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0a0412; color: #ffffff; }
        .container { max-width: 650px; margin: 0 auto; padding: 20px; }
        .header { border-bottom: 2px solid #4EBBD2; padding-bottom: 12px; margin-bottom: 24px; }
        .header h2 { color: #00d9ff; letter-spacing: 2px; margin: 0; }
        .meta { background-color: rgba(0, 217, 255, 0.05); padding: 24px; margin: 24px 0; border: 1px solid rgba(0, 217, 255, 0.2); }
        .meta p { margin: 8px 0; color: #ffffff; }
        .meta strong { color: #4EBBD2; }
        .meta a { color: #00d9ff; text-decoration: none; }
        .body-block { background-color: rgba(255, 255, 255, 0.03); padding: 24px; margin: 24px 0; border-left: 3px solid #00d9ff; }
        .body-block p { color: #4EBBD2; margin-bottom: 12px; }
        .body-block .msg { color: #ffffff; line-height: 1.8; font-size: 15px; white-space: pre-wrap; }
        .reply-tip { margin-top: 30px; padding: 18px; background-color: rgba(0, 217, 255, 0.08); border: 1px solid rgba(0, 217, 255, 0.3); }
        .reply-tip p { color: #00d9ff; font-size: 13px; margin: 0; }
        .footer { margin-top: 30px; padding-top: 20px; text-align: center; border-top: 1px solid rgba(255,255,255,0.1); }
        .footer p { color: rgba(255,255,255,0.4); font-size: 11px; letter-spacing: 1px; margin: 0; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h2>✦ NEW CONTACT FORM SUBMISSION</h2>
        </div>

        <div class='meta'>
            <p><strong>From:</strong> {$name}</p>
            <p><strong>Email:</strong> <a href='mailto:{$email}'>{$email}</a></p>
            <p><strong>Subject:</strong> {$subject}</p>
            <p><strong>Sent:</strong> " . date('F j, Y, g:i a T') . "</p>
        </div>

        <div class='body-block'>
            <p><strong>MESSAGE:</strong></p>
            <p class='msg'>" . nl2br($message) . "</p>
        </div>

        <div class='reply-tip'>
            <p><strong>Quick Reply:</strong> Just hit \"Reply\" to respond directly to {$name}</p>
        </div>

        <div class='footer'>
            <p>SENT FROM JOHNATHANKEMP.ORG CONTACT FORM</p>
        </div>
    </div>
</body>
</html>
";

// Headers
$headers  = "MIME-Version: 1.0\r\n";
$headers .= "Content-type: text/html; charset=UTF-8\r\n";
$headers .= "From: Johnathan Kemp Site <noreply@johnathankemp.org>\r\n";
$headers .= "Reply-To: {$email}\r\n";
$headers .= "X-Mailer: PHP/" . phpversion();

// Send
$mailSent = mail($recipient, $emailSubject, $emailBody, $headers);

if ($mailSent) {
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Email sent successfully'
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to send email. Please try again or contact directly at contact@johnathankemp.org'
    ]);
}
?>