from firebase_admin import auth


def verify_firebase_token(id_token: str) -> dict:
    return auth.verify_id_token(id_token, check_revoked=True)


def revoke_firebase_tokens(uid: str) -> None:
    auth.revoke_refresh_tokens(uid)
