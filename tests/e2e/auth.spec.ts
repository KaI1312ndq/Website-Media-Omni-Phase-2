import { test, expect } from '@playwright/test'

const TEST_USER = process.env.E2E_TEST_USER
const TEST_PASS = process.env.E2E_TEST_PASS

test.describe('Auth API', () => {
  test('rejects empty credentials', async ({ request }) => {
    const r = await request.post('/api/auth', { data: { username: '', password: '' } })
    expect(r.status()).toBe(400)
  })

  test('rejects wrong password', async ({ request }) => {
    const r = await request.post('/api/auth', { data: { username: 'doesnotexist', password: 'wrong' } })
    expect([401, 429]).toContain(r.status())
  })

  test.skip(!TEST_USER || !TEST_PASS, 'skip live login without E2E_TEST_USER/E2E_TEST_PASS')
  test('valid login sets session cookie', async ({ page, context }) => {
    if (!TEST_USER || !TEST_PASS) return
    await page.goto('/')
    await page.evaluate(() => document.getElementById('login-modal')?.classList.add('open'))
    await page.fill('#login-user', TEST_USER!)
    await page.fill('#login-pass', TEST_PASS!)
    await page.locator('.modal-btn').click()
    await page.waitForURL(/\/dashboard/, { timeout: 10_000 })
    const cookies = await context.cookies()
    const session = cookies.find(c => c.name === 'mo_session')
    expect(session).toBeDefined()
  })
})
