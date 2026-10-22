"""
Tenant-aware database registry.
Stores references to each tenant's MongoDB database and provides
a per-request ContextVar so the TenantDB proxy can route to the right DB.
"""
from contextvars import ContextVar
from typing import Optional

# Per-request context variable — stores the actual DB for the current request
_db_ctx: ContextVar = ContextVar('_db_ctx', default=None)

# Global registry — populated at startup by server.py
_registry: dict = {}


def register_dbs(main_db, canada_db) -> None:
    """Called once at startup to register both tenant databases."""
    _registry['main'] = main_db
    _registry['canada'] = canada_db


def set_tenant_context(tenant: str) -> None:
    """
    Called from get_current_user() for every authenticated request.
    Sets the correct DB for the current async context.
    """
    db = _registry.get(tenant)
    if db is None:
        db = _registry.get('main')
    if db is not None:
        _db_ctx.set(db)


def get_tenant_db():
    """Return the DB assigned to this request (or None if not set)."""
    return _db_ctx.get(None)


def get_db_for_tenant(tenant: str):
    """Resolve a tenant name to a database object directly."""
    db = _registry.get(tenant)
    if db is None:
        db = _registry.get('main')
    return db
