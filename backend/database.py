import os
from pathlib import Path
from collections.abc import AsyncGenerator

from dotenv import load_dotenv
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql+asyncpg://clinic:clinic@localhost:5432/clinic_db",
)

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session


async def init_db() -> None:
    from models import PatientTable, VisitTable  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        for stmt in (
            """
            ALTER TABLE patients
            ADD COLUMN IF NOT EXISTS doctor_name VARCHAR(512) NOT NULL DEFAULT '';
            """,
            """
            ALTER TABLE patients
            ADD COLUMN IF NOT EXISTS notes TEXT NOT NULL DEFAULT '';
            """,
        ):
            await conn.execute(text(stmt))


async def close_db() -> None:
    await engine.dispose()
