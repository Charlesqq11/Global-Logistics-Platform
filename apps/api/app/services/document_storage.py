from __future__ import annotations

from pathlib import Path
from uuid import UUID, uuid4

from fastapi import UploadFile


class DocumentStorageError(Exception):
    """Raised when document storage operations fail."""


class LocalDocumentStorage:
    def __init__(
        self,
        base_path: str = "storage/documents",
    ) -> None:
        self.base_path = Path(base_path)

    def resolve(self, storage_key: str) -> Path:
        """
        Resolve a stored document path safely.

        Prevents access to files outside the configured
        document storage directory.
        """

        base_directory = self.base_path.resolve()

        try:
            path = Path(storage_key).resolve(strict=True)

            path.relative_to(base_directory)

        except (OSError, ValueError, RuntimeError) as exc:
            raise DocumentStorageError(
                "Document path is invalid or inaccessible."
            ) from exc

        if not path.is_file():
            raise DocumentStorageError(
                "Stored document is not a valid file."
            )

        return path

    def save(
        self,
        *,
        shipment_id: UUID,
        file: UploadFile,
    ) -> tuple[str, str]:

        if not file.filename:
            raise DocumentStorageError(
                "Uploaded file must have a filename."
            )

        shipment_directory = (
            self.base_path / str(shipment_id)
        )

        shipment_directory.mkdir(
            parents=True,
            exist_ok=True,
        )

        extension = Path(file.filename).suffix.lower()

        storage_filename = (
            f"{uuid4().hex}{extension}"
        )

        storage_path = (
            shipment_directory / storage_filename
        )

        try:
            with storage_path.open("wb") as destination:
                while chunk := file.file.read(1024 * 1024):
                    destination.write(chunk)

        except OSError as exc:
            raise DocumentStorageError(
                "Failed to store uploaded document."
            ) from exc

        storage_key = storage_path.as_posix()

        return storage_key, file.filename

    def delete(self, storage_key: str) -> None:

        try:
            path = self.resolve(storage_key)

            path.unlink()

        except DocumentStorageError:
            raise

        except OSError as exc:
            raise DocumentStorageError(
                "Failed to delete stored document."
            ) from exc