"""
Soul Garden - Persistent AI Agent Platform
FastAPI application entry point.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import agents, gardens, memories, reflections
from app.core.config import get_settings
from app.db.database import Database


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    settings = get_settings()
    print(f"🌱 Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    
    # Initialize database connection
    await Database.get_client()
    print("✅ Database connected")
    
    yield
    
    # Shutdown
    await Database.close()
    print("🌙 Goodbye")


def create_app() -> FastAPI:
    """Application factory."""
    settings = get_settings()
    
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="""
        Soul Garden API - Persistent AI Agent Platform
        
        ## Features
        
        - **Persistent Agents**: Continuous operation with memory and identity
        - **Three-Layer Memory**: Working context, RAG retrieval, archive storage
        - **Identity Evolution**: LORE.md, SOUL.md, IDENTITY.md, DRIFT_LOG.json
        - **Reflection Engine**: Self-analysis and personality development
        - **Multi-Agent Gardens**: Collaborative workspaces
        """,
        lifespan=lifespan
    )
    
    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"] if settings.DEBUG else ["http://localhost:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Include routers
    app.include_router(agents.router, prefix="/api/agents", tags=["Agents"])
    app.include_router(gardens.router, prefix="/api/gardens", tags=["Gardens"])
    app.include_router(memories.router, prefix="/api/memories", tags=["Memories"])
    app.include_router(reflections.router, prefix="/api/reflections", tags=["Reflections"])
    
    @app.get("/health")
    async def health_check():
        """Health check endpoint."""
        return {
            "status": "healthy",
            "app": settings.APP_NAME,
            "version": settings.APP_VERSION
        }
    
    # Static files and Frontend Single Page App (SPA) support
    from fastapi.staticfiles import StaticFiles
    from fastapi.responses import FileResponse
    import os

    # Look for frontend/dist relative to the root or backend folder
    frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")
    if not os.path.exists(frontend_path):
        # Fallback for different directory structures in production
        frontend_path = os.path.join(os.getcwd(), "frontend", "dist")

    if os.path.exists(frontend_path):
        app.mount("/assets", StaticFiles(directory=os.path.join(frontend_path, "assets")), name="assets")
        
        @app.get("/{full_path:path}")
        async def serve_frontend(full_path: str):
            # API routes should have been handled by routers above.
            # If we get here, it's a frontend route or asset.
            file_path = os.path.join(frontend_path, full_path)
            if os.path.isfile(file_path):
                return FileResponse(file_path)
            return FileResponse(os.path.join(frontend_path, "index.html"))
    else:
        @app.get("/")
        async def root():
            """Root endpoint (fallback)."""
            return {
                "message": f"Welcome to {settings.APP_NAME}",
                "version": settings.APP_VERSION,
                "docs": "/docs",
                "warning": "Frontend build not found. Please run 'npm run build' in the frontend directory."
            }
    
    return app


app = create_app()

if __name__ == "__main__":
    import uvicorn
    settings = get_settings()
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
