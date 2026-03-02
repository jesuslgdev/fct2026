import json

import firebase_admin
from firebase_admin import auth, credentials

from shared.config import settings


def init_firebase_app() -> None:
    cred = credentials.Certificate(
        json.loads(settings.firebase_credentials_json)
    )
    firebase_admin.initialize_app(cred)


def verify_firebase_token(id_token: str) -> dict:
    return auth.verify_id_token(id_token)
