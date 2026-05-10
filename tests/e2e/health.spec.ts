import { test, expect } from '@playwright/test'

test('GET /api/health returns expected shape', async ({ request }) => {
  const r = await request.get('/api/health')
  expect([200, 503]).toContain(r.status())
  const j = await r.json()
  expect(j).toHaveProperty('status')
  expect(j).toHaveProperty('db')
  expect(j).toHaveProperty('sanity')
  expect(j).toHaveProperty('time')
})
