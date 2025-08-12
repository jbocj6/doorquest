import os
from fastapi import FastAPI, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlmodel import SQLModel, Field, Session, create_engine, select
from passlib.context import CryptContext
from pathlib import Path

app = FastAPI()

# Enable CORS to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (update this in production)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
sqlite_file_name = "database.db"
engine = create_engine(f"sqlite:///{sqlite_file_name}", echo=False)

class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    username: str
    password: str

SQLModel.metadata.create_all(engine)

# Password hashing setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Directory to store profile pictures
PROFILE_PICS_DIR = Path("profile_pics")
PROFILE_PICS_DIR.mkdir(exist_ok=True)  # Create the directory if it doesn't exist

@app.get("/")
def read_root():
    return {"message": "DoorQuest API is running!"}

@app.post("/register")
def register(username: str = Form(...), password: str = Form(...)):
    hashed_password = pwd_context.hash(password)
    with Session(engine) as session:
        user = User(username=username, password=hashed_password)
        session.add(user)
        session.commit()
    return {"message": f"User '{username}' registered successfully!"}

@app.get("/users")
def get_users():
    with Session(engine) as session:
        users = session.exec(select(User)).all()
        return {"users": [u.username for u in users]}

@app.post("/login")
def login(username: str = Form(...), password: str = Form(...)):
    with Session(engine) as session:
        user = session.exec(select(User).where(User.username == username)).first()
        if user and pwd_context.verify(password, user.password):
            return {"message": f"Welcome, {username}!"}
        return {"message": "Invalid username or password."}

@app.post("/upload-profile-pic")
async def upload_profile_pic(username: str = Form(...), file: UploadFile = Form(...)):
    if not username:
        raise HTTPException(status_code=400, detail="Username is required")
    if not file:
        raise HTTPException(status_code=400, detail="File is required")

    ext = file.filename.split(".")[-1]  # Get the file extension
    if ext.lower() not in ["jpg", "jpeg", "png"]:  # Validate file type
        raise HTTPException(status_code=400, detail="Invalid file type. Only JPG, JPEG, and PNG are allowed.")

    filename = f"{username}.jpg"  # Save the file as username.jpg
    file_path = PROFILE_PICS_DIR / filename

    try:
        with open(file_path, "wb") as f:
            f.write(await file.read())  # Save the file
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    return {"message": "Profile picture uploaded!", "filename": filename}

@app.get("/profile-pic/{username}")
async def get_profile_pic(username: str):
    file_path = PROFILE_PICS_DIR / f"{username}.jpg"  # Adjust extension if needed
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Profile picture not found")
    return FileResponse(file_path)

@app.post("/change-password")
def change_password(username: str = Form(...), old_password: str = Form(...), new_password: str = Form(...)):
    with Session(engine) as session:
        user = session.exec(select(User).where(User.username == username)).first()
        if user and pwd_context.verify(old_password, user.password):
            user.password = pwd_context.hash(new_password)
            session.add(user)
            session.commit()
            return {"message": "Password updated successfully!"}
        return {"message": "Invalid username or password."}