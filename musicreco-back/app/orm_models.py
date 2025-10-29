from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from .db import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)

    playlists = relationship("Playlist", back_populates="user")

class Playlist(Base):
    __tablename__ = "playlists"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    tags = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="playlists")
    items = relationship("PlaylistItem", cascade="all, delete-orphan",
                         back_populates="playlist", order_by="PlaylistItem.position")

class PlaylistItem(Base):
    __tablename__ = "playlist_items"
    id = Column(Integer, primary_key=True)
    playlist_id = Column(Integer, ForeignKey("playlists.id"), index=True)
    position = Column(Integer, nullable=False)
    song_id = Column(Integer, index=True)
    title = Column(String)
    artists = Column(JSON, default=list)
    genres = Column(JSON, default=list)

    playlist = relationship("Playlist", back_populates="items")
