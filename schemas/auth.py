from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    display_name: str

class UserRead(BaseModel):
    id: int
    email: EmailStr

    class Config:
        from_attributes = True
        
class UserLogin(BaseModel):
    email: EmailStr
    password: str
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
