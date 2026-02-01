from pydantic import BaseModel


class LoginRequest(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: str | None = None


class ChangePassword(BaseModel):
    current_password: str
    new_password: str


class ChangeUsername(BaseModel):
    new_username: str
    password: str
