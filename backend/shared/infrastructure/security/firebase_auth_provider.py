import json
import logging
from collections.abc import Mapping
from typing import Any

from firebase_admin import auth
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token

from shared.config import settings

logger = logging.getLogger(__name__)

_FIREBASE_CERTS_URLS = (
    "https://www.googleapis.com/service_accounts/v1/jwk/"
    "securetoken%40system.gserviceaccount.com",
    "https://www.googleapis.com/service_accounts/v1/metadata/x509/"
    "securetoken%40system.gserviceaccount.com",
    "https://www.googleapis.com/robot/v1/metadata/x509/"
    "securetoken%40system.gserviceaccount.com",
)


class _LoggingGoogleRequest:
    def __init__(self) -> None:
        self._request = google_requests.Request()

    def __call__(
        self,
        url: str,
        method: str = "GET",
        body: bytes | None = None,
        headers: Mapping[str, str] | None = None,
        timeout: float | None = None,
        **kwargs: Any,
    ):
        try:
            response = self._request(
                url=url,
                method=method,
                body=body,
                headers=headers,
                timeout=timeout,
                **kwargs,
            )
        except Exception:
            logger.exception("Google certificate request failed before response")
            raise

        logger.warning(
            "Google certificate request returned status=%s url=%s bytes=%s",
            response.status,
            url,
            len(response.data or b""),
        )
        return response


def verify_firebase_token(id_token: str) -> dict:
    project_id = json.loads(settings.firebase_credentials_json)["project_id"]
    last_error: Exception | None = None
    for certs_url in _FIREBASE_CERTS_URLS:
        try:
            claims = google_id_token.verify_token(
                id_token,
                _LoggingGoogleRequest(),
                audience=project_id,
                certs_url=certs_url,
            )
            break
        except Exception as exc:
            last_error = exc
            logger.warning(
                "Firebase token verification failed with certs_url=%s: %s",
                certs_url,
                exc,
            )
    else:
        if last_error is not None:
            raise last_error
        raise ValueError("Firebase token verification failed")

    expected_issuer = f"https://securetoken.google.com/{project_id}"
    if claims.get("iss") != expected_issuer:
        raise ValueError("Invalid Firebase token issuer")
    return claims


def revoke_firebase_tokens(uid: str) -> None:
    auth.revoke_refresh_tokens(uid)
