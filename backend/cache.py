import json

try:
    import redis
    _client = redis.Redis(host="localhost", port=6379, db=0, decode_responses=True)
    _client.ping()          
    _redis_available = True
except Exception:
    _client = None
    _redis_available = False
    print("Redis not available; running without caching.")


class Cache:
    def get(self, key):
        if not _redis_available:
            return None
        raw = _client.get(key)
        return json.loads(raw) if raw else None

    def set(self, key, value, ttl=60):
        if not _redis_available:
            return
        _client.setex(key, ttl, json.dumps(value))
    def delete(self, key):
        if not _redis_available:
            return
        _client.delete(key)

cache = Cache()