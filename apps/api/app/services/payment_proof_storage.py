from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile

from app.core.config import PROJECT_ROOT, settings


class PaymentProofStorageError(ValueError):
    pass


class PaymentProofStorage:
    ALLOWED_TYPES = {
        "pdf": ("application/pdf", b"%PDF-"),
        "jpg": ("image/jpeg", b"\xff\xd8\xff"),
        "png": ("image/png", b"\x89PNG\r\n\x1a\n"),
        "webp": ("image/webp", b"RIFF"),
    }

    def __init__(self) -> None:
        configured_path = Path(settings.payment_proof_storage_path)

        if configured_path.is_absolute():
            self.base_path = configured_path.resolve()
        else:
            self.base_path = (PROJECT_ROOT / configured_path).resolve()

        self.max_size_bytes = settings.payment_proof_max_size_bytes

        if self.max_size_bytes <= 0:
            raise ValueError("Payment proof maximum size must be positive.")

        self.base_path.mkdir(parents=True, exist_ok=True)

    def _detect_file_type(self, header: bytes) -> tuple[str, str]:
        if header.startswith(b"%PDF-"):
            return "pdf", "application/pdf"

        if header.startswith(b"\xff\xd8\xff"):
            return "jpg", "image/jpeg"

        if header.startswith(b"\x89PNG\r\n\x1a\n"):
            return "png", "image/png"

        if len(header) >= 12 and header.startswith(b"RIFF") and header[8:12] == b"WEBP":
            return "webp", "image/webp"

        raise PaymentProofStorageError(
            "Unsupported file. Upload a valid PDF, JPEG, PNG, or WebP file."
        )

    async def save(self, upload: UploadFile) -> tuple[str, str, int]:
        temporary_key = f"{uuid4().hex}.uploading"
        temporary_path = self._resolve_key(temporary_key)

        total_size = 0
        header = bytearray()

        try:
            with temporary_path.open("xb") as destination:
                while True:
                    chunk = await upload.read(64 * 1024)

                    if not chunk:
                        break

                    total_size += len(chunk)

                    if total_size > self.max_size_bytes:
                        raise PaymentProofStorageError(
                            "Payment proof exceeds the 10 MB upload limit."
                        )

                    if len(header) < 12:
                        header.extend(chunk[: 12 - len(header)])

                    destination.write(chunk)

            if total_size == 0:
                raise PaymentProofStorageError("The uploaded file is empty.")

            extension, mime_type = self._detect_file_type(bytes(header))

            storage_key = f"{uuid4().hex}.{extension}"
            final_path = self._resolve_key(storage_key)

            temporary_path.replace(final_path)

            return storage_key, mime_type, total_size

        except Exception:
            temporary_path.unlink(missing_ok=True)
            raise

    def _resolve_key(self, storage_key: str) -> Path:
        if (
            not storage_key
            or Path(storage_key).name != storage_key
            or "/" in storage_key
            or "\\" in storage_key
        ):
            raise PaymentProofStorageError("Invalid payment proof storage key.")

        resolved = (self.base_path / storage_key).resolve()

        if resolved.parent != self.base_path:
            raise PaymentProofStorageError("Invalid payment proof storage path.")

        return resolved

    def resolve(self, storage_key: str) -> Path:
        path = self._resolve_key(storage_key)

        if not path.is_file():
            raise FileNotFoundError("Payment proof file not found.")

        return path

    def delete(self, storage_key: str) -> None:
        path = self._resolve_key(storage_key)
        path.unlink(missing_ok=True)


payment_proof_storage = PaymentProofStorage()
