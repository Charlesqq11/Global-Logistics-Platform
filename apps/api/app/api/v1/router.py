from fastapi import APIRouter

from app.api.v1.admin_shipments import router as admin_shipments_router
from app.api.v1.auth import router as auth_router
from app.api.v1.tracking import router as tracking_router
from app.api.v1.admin_customs import router as admin_customs_router
from app.api.v1.admin_payments import router as admin_payments_router
from app.api.v1.admin_payment_proofs import router as admin_payment_proofs_router
from app.api.v1.admin_bank_accounts import router as admin_bank_accounts_router
from app.api.v1.admin_documents import router as admin_documents_router
from app.api.v1.admin_customers import router as admin_customers_router
from app.api.v1.customer_portal import router as customer_portal_router
from app.api.v1.admin_analytics import router as admin_analytics_router
from app.api.v1.assistant import router as assistant_router


router = APIRouter(prefix="/api/v1")

router.include_router(auth_router)
router.include_router(tracking_router)
router.include_router(admin_shipments_router)
router.include_router(admin_customs_router)
router.include_router(admin_payments_router)
router.include_router(admin_payment_proofs_router)
router.include_router(admin_bank_accounts_router)
router.include_router(admin_documents_router)
router.include_router(admin_customers_router)
router.include_router(customer_portal_router)
router.include_router(admin_analytics_router)
router.include_router(assistant_router)
router.include_router(admin_analytics_router)
