"""Password hashing and token blacklist utilities."""
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# In-memory token blacklist (for logout). Replace with Redis in production.
_blacklisted_tokens: set[str] = set()


def hash_password(plain_password: str) -> str:
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def blacklist_token(token: str) -> None:
    _blacklisted_tokens.add(token)


def is_token_blacklisted(token: str) -> bool:
    return token in _blacklisted_tokens
