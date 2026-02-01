import time
import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("app.middleware")

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Log Request
        print(f"DEBUG PRINT: REQ {request.method} {request.url.path}")
        logger.info(f"REQ: {request.method} {request.url.path}")
        
        response = await call_next(request)
        
        process_time = time.time() - start_time
        
        # Log Response
        logger.info(
            f"RES: {request.method} {request.url.path} - Status: {response.status_code} - Time: {process_time:.4f}s"
        )
        
        return response
