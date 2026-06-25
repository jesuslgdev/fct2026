import json

from firebase_admin import auth
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token

from shared.config import settings

_FIREBASE_CERTS_URL = (
    "https://www.googleapis.com/service_accounts/v1/metadata/x509/"
    "securetoken@system.gserviceaccount.com"
)


def verify_firebase_token(id_token: str) -> dict:
    project_id = json.loads(settings.firebase_credentials_json)["project_id"]
    claims = google_id_token.verify_token(
        id_token,
        google_requests.Request(),
        audience=project_id,
        certs_url=_FIREBASE_CERTS_URL,
    )
    expected_issuer = f"https://securetoken.google.com/{project_id}"
    if claims.get("iss") != expected_issuer:
        raise ValueError("Invalid Firebase token issuer")
    return claims


def revoke_firebase_tokens(uid: str) -> None:
    auth.revoke_refresh_tokens(uid)
