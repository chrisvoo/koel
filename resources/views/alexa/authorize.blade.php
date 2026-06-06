<!DOCTYPE html>
<html lang="en">
<head>
    <title>Link your Koel account</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: #181A1F;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 1rem;
        }

        .card {
            background: #282A2F;
            border-radius: 12px;
            padding: 2.5rem 2rem;
            width: 100%;
            max-width: 380px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }

        .logo {
            text-align: center;
            margin-bottom: 1.5rem;
            font-size: 1.75rem;
            font-weight: 700;
            letter-spacing: 2px;
        }

        .subtitle {
            text-align: center;
            color: #a0a0a0;
            font-size: 0.875rem;
            margin-bottom: 2rem;
            line-height: 1.4;
        }

        .error {
            background: rgba(239, 68, 68, 0.15);
            border: 1px solid rgba(239, 68, 68, 0.4);
            color: #fca5a5;
            padding: 0.75rem 1rem;
            border-radius: 8px;
            font-size: 0.875rem;
            margin-bottom: 1.25rem;
        }

        label {
            display: block;
            font-size: 0.8125rem;
            color: #a0a0a0;
            margin-bottom: 0.375rem;
        }

        input[type="email"],
        input[type="password"] {
            width: 100%;
            padding: 0.75rem 1rem;
            background: #1E2025;
            border: 1px solid #3a3d44;
            border-radius: 8px;
            color: #fff;
            font-size: 0.9375rem;
            margin-bottom: 1rem;
            outline: none;
            transition: border-color 0.15s;
        }

        input:focus {
            border-color: #6366f1;
        }

        button {
            width: 100%;
            padding: 0.8125rem;
            background: #6366f1;
            color: #fff;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.15s;
        }

        button:hover { background: #4f46e5; }
        button:active { background: #4338ca; }
    </style>
</head>
<body>
    <div class="card">
        <div class="logo">KOEL</div>
        <p class="subtitle">Sign in to link your Koel account with Alexa.</p>

        @if(!empty($error))
            <div class="error">{{ $error }}</div>
        @endif

        <form method="POST" action="{{ url('alexa/authorize') }}">
            @csrf
            <input type="hidden" name="state" value="{{ $state }}">
            <input type="hidden" name="client_id" value="{{ $client_id }}">
            <input type="hidden" name="redirect_uri" value="{{ $redirect_uri }}">

            <label for="email">Email</label>
            <input type="email" id="email" name="email" required autofocus>

            <label for="password">Password</label>
            <input type="password" id="password" name="password" required>

            <button type="submit">Sign in &amp; Link Account</button>
        </form>
    </div>
</body>
</html>
