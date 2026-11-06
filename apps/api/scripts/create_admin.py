from __future__ import annotations

import os
import sys

from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.access import Permission, Role, User


ADMIN_PERMISSIONS = [
    ("shipments.create", "Create shipments"),
    ("shipments.read", "View shipments"),
    ("shipments.update", "Update shipments"),
    ("tracking.manage", "Manage tracking events"),
    ("customers.read", "View customers"),
    ("customs.manage", "Manage customs cases"),
    ("payments.manage", "Manage payment requests"),
    ("documents.manage", "Manage shipment documents"),
]


def required_env(name: str) -> str:
    value = os.getenv(name)

    if not value:
        raise RuntimeError(
            f"Required environment variable is missing: {name}"
        )

    return value.strip()


def main() -> None:
    email = required_env("BOOTSTRAP_ADMIN_EMAIL").lower()
    password = required_env("BOOTSTRAP_ADMIN_PASSWORD")
    first_name = os.getenv(
        "BOOTSTRAP_ADMIN_FIRST_NAME",
        "System",
    ).strip()

    last_name = os.getenv(
        "BOOTSTRAP_ADMIN_LAST_NAME",
        "Administrator",
    ).strip()

    if len(password) < 12:
        raise RuntimeError(
            "BOOTSTRAP_ADMIN_PASSWORD must be at least 12 characters."
        )

    db = SessionLocal()

    try:
        user = db.scalar(
            select(User).where(User.email == email)
        )

        if user is None:
            user = User(
                email=email,
                password_hash=hash_password(password),
                first_name=first_name,
                last_name=last_name,
                is_active=True,
                is_verified=True,
            )

            db.add(user)
            db.flush()

            print(f"Created admin user: {email}")

        else:
            print(f"Admin user already exists: {email}")

        role = db.scalar(
            select(Role).where(
                Role.name == "SUPER_ADMIN"
            )
        )

        if role is None:
            role = Role(
                name="SUPER_ADMIN",
                description="Full administrative access.",
                is_active=True,
            )

            db.add(role)
            db.flush()

            print("Created SUPER_ADMIN role.")

        for permission_name, description in ADMIN_PERMISSIONS:
            permission = db.scalar(
                select(Permission).where(
                    Permission.name == permission_name
                )
            )

            if permission is None:
                permission = Permission(
                    name=permission_name,
                    description=description,
                )

                db.add(permission)
                db.flush()

            if permission not in role.permissions:
                role.permissions.append(permission)

        if role not in user.roles:
            user.roles.append(role)

        db.commit()

        print("Administrator bootstrap completed successfully.")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)