"""
Serves the built React app's index.html for the SPA root and any
client-side (React Router) route, e.g. /login, /dashboard, /routes.

Actual JS/CSS/image assets referenced inside that index.html (e.g.
/assets/index-abc123.js) are handled separately by WhiteNoise, which is
pointed at the same frontend/dist folder via WHITENOISE_ROOT in
settings.py - it serves those before Django's URL routing even runs.
This view only ever needs to hand back the HTML shell itself.
"""
from django.conf import settings
from django.http import HttpResponse, HttpResponseNotFound

_index_html_cache = None


def serve_frontend(request):
    global _index_html_cache

    index_path = settings.FRONTEND_DIST / "index.html"

    if settings.DEBUG:
        # Always read fresh in debug mode so local edits show up immediately.
        if not index_path.exists():
            return HttpResponseNotFound(
                "Frontend build not found. Run `npm run build` inside "
                "frontend/ first, or use `npm run dev` for local frontend "
                "development instead of this backend-served route."
            )
        return HttpResponse(index_path.read_text(encoding="utf-8"))

    if _index_html_cache is None:
        if not index_path.exists():
            return HttpResponseNotFound("Frontend build not found.")
        _index_html_cache = index_path.read_text(encoding="utf-8")

    return HttpResponse(_index_html_cache)
