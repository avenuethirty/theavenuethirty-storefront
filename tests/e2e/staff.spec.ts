import {expect,test} from '@playwright/test'
test('staff workspace stays closed in fixture preview',async({page})=>{await page.goto('/staff/orders');await expect(page.getByText(/Staff workspace unavailable|We could not load this page/).first()).toBeVisible();await expect(page.getByRole('button',{name:'Save test order and reserve stock'})).toHaveCount(0)})
