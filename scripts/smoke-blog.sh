#!/usr/bin/env bash
# Blog system smoke test — hits Commerce API directly.
# Usage:
#   COMMERCE_API_URL=https://... ADMIN_KEY=... bash scripts/smoke-blog.sh
#
# Defaults to localhost:4000 with key "admin-secret" for local dev.

set -euo pipefail

API="${COMMERCE_API_URL:-http://localhost:4000}"
KEY="${ADMIN_KEY:-admin-secret}"
ADMIN="$API/api/admin"
PUBLIC="$API/api/blog"

PASS=0
FAIL=0

check() {
  local label="$1" expected="$2" actual="$3"
  if [[ "$actual" == "$expected" ]]; then
    echo "  ✓  $label"
    ((PASS++))
  else
    echo "  ✗  $label  (got: $actual, want: $expected)"
    ((FAIL++))
  fi
}

http_status() {
  curl -s -o /dev/null -w "%{http_code}" "$@"
}

json_field() {
  # $1 = json string, $2 = field name (top-level)
  echo "$1" | grep -o "\"$2\":[^,}]*" | head -1 | sed 's/.*: *"\?\([^",}]*\)"\?.*/\1/'
}

echo ""
echo "=== Blog Smoke Test  →  $API ==="
echo ""

# ── 0. Health ──────────────────────────────────────────────────────────────────
echo "0. Health"
status=$(http_status "$API/health")
check "GET /health → 200" "200" "$status"

# ── 1. Admin: Create category ──────────────────────────────────────────────────
echo ""
echo "1. Admin: Category CRUD"
cat_body=$(curl -s -X POST "$ADMIN/blog/categories" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: $KEY" \
  -d '{"slug":"smoke-test-cat","sortOrder":99,"isActive":true,"translations":[{"locale":"de","name":"Smoke-Test-Kategorie","description":"Temp"}]}')
cat_id=$(json_field "$cat_body" "id")
check "POST /admin/blog/categories → has id" "1" "$([[ -n "$cat_id" ]] && echo 1 || echo 0)"

status=$(http_status -H "X-Admin-Key: $KEY" "$ADMIN/blog/categories/$cat_id")
check "GET /admin/blog/categories/:id → 200" "200" "$status"

# ── 2. Admin: Create post ──────────────────────────────────────────────────────
echo ""
echo "2. Admin: Post CRUD"
post_body=$(curl -s -X POST "$ADMIN/blog/posts" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: $KEY" \
  -d "{
    \"slug\": \"smoke-test-post\",
    \"status\": \"draft\",
    \"featured\": false,
    \"categoryId\": \"$cat_id\",
    \"tagIds\": [],
    \"translations\": [{
      \"locale\": \"de\",
      \"title\": \"Smoke-Test-Beitrag\",
      \"excerpt\": \"Temporärer Beitrag für Smoke-Tests.\",
      \"content\": \"<p>Test</p>\",
      \"metaTitle\": null,
      \"metaDescription\": null,
      \"ogTitle\": null,
      \"ogDescription\": null
    }]
  }")
post_id=$(json_field "$post_body" "id")
check "POST /admin/blog/posts → has id" "1" "$([[ -n "$post_id" ]] && echo 1 || echo 0)"

status=$(http_status -H "X-Admin-Key: $KEY" "$ADMIN/blog/posts/$post_id")
check "GET /admin/blog/posts/:id → 200" "200" "$status"

# ── 3. Admin: Publish ─────────────────────────────────────────────────────────
echo ""
echo "3. Admin: Status transition"
status=$(http_status -X PATCH "$ADMIN/blog/posts/$post_id/status" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: $KEY" \
  -d '{"status":"published"}')
check "PATCH /admin/blog/posts/:id/status published → 200" "200" "$status"

# ── 4. Public API: List posts ─────────────────────────────────────────────────
echo ""
echo "4. Public API"
list_body=$(curl -s "$PUBLIC/posts?locale=de&limit=1")
total=$(json_field "$list_body" "total")
check "GET /api/blog/posts returns data array" "1" "$([[ -n "$total" ]] && echo 1 || echo 0)"

detail_body=$(curl -s "$PUBLIC/posts/smoke-test-post?locale=de")
detail_slug=$(json_field "$detail_body" "slug")
check "GET /api/blog/posts/smoke-test-post returns slug" "smoke-test-post" "$detail_slug"

cats_body=$(curl -s "$PUBLIC/categories?locale=de")
check "GET /api/blog/categories → 200" "200" "$(http_status "$PUBLIC/categories?locale=de")"

# ── 5. Sitemap ────────────────────────────────────────────────────────────────
# Sitemap is served by Next.js, not the Commerce API — skip if API-only mode
if [[ -n "${STOREFRONT_URL:-}" ]]; then
  echo ""
  echo "5. Sitemap (Storefront)"
  status=$(http_status "${STOREFRONT_URL}/sitemap.xml")
  check "GET /sitemap.xml → 200" "200" "$status"
  status=$(http_status "${STOREFRONT_URL}/robots.txt")
  check "GET /robots.txt → 200" "200" "$status"
fi

# ── 6. Cleanup ────────────────────────────────────────────────────────────────
echo ""
echo "6. Cleanup"
status=$(http_status -X DELETE -H "X-Admin-Key: $KEY" "$ADMIN/blog/posts/$post_id")
check "DELETE /admin/blog/posts/:id → 204 or 200" "1" "$([[ "$status" == "204" || "$status" == "200" ]] && echo 1 || echo 0)"

# Categories may have postCount > 0 check; post already deleted so this should work
curl -s -X DELETE -H "X-Admin-Key: $KEY" "$ADMIN/blog/categories/$cat_id" -o /dev/null || true
echo "  ·  category cleanup attempted"

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "─────────────────────────────────"
echo "  PASS: $PASS   FAIL: $FAIL"
echo "─────────────────────────────────"
echo ""

[[ "$FAIL" -eq 0 ]]
