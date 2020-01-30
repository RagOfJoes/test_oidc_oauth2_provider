GET /auth rp(code): http://localhost:8082/auth?client_id=<CLIENT_ID>&client_secret=<CLIENT_SECRET>&response_type=<ENUM: code, id_token, code id_token>&scope=<ENUM: openid, email, profile>&nonce=<OPAQUE_VALUE>

POST /token: http://localhost:8082/token
                -   client_id -> Client ID
                -   client_secret -> Client Secret
                -   redirect_url -> Same URL from Endpoint above
                -   code -> Authorization Code from Edpoint above   
                -   grant_type -> ENUM: authorization_code, refresh_token, implicit(ONLY ON TRUSTED CLIENTS), password(ONLY ON TRUSTED CLIENTS)
