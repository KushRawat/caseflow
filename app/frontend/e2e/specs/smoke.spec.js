import { test, expect } from '@playwright/test';
import path from 'node:path';
test.describe('CaseFlow smoke tests', () => {
    test('login form renders', async ({ page }) => {
        await page.goto('/login');
        await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
        await expect(page.getByLabel('Email')).toBeVisible();
        await expect(page.getByLabel('Password')).toBeVisible();
    });
    test('import workspace loads when auth state is present', async ({ page }) => {
        await page.addInitScript((storedUser) => {
            window.localStorage.setItem('caseflow-auth', JSON.stringify({
                state: {
                    user: storedUser,
                    accessToken: 'test-access',
                    refreshToken: 'test-refresh'
                },
                version: 0
            }));
        }, { id: 'tester', email: 'tester@example.com', role: 'ADMIN' });
        await page.goto('/import');
        await expect(page.getByRole('heading', { name: 'Case import workspace' })).toBeVisible();
        await expect(page.getByText('Upload, validate, and submit clean data')).toBeVisible();
    });
    test('mocked CSV upload, validation, and submission flow', async ({ page }) => {
        const sampleCsv = path.resolve(process.cwd(), '../data/sample-clean.csv');
        const mockUser = { id: 'tester', email: 'tester@example.com', role: 'ADMIN' };
        await page.addInitScript((storedUser) => {
            window.localStorage.setItem('caseflow-auth', JSON.stringify({
                state: {
                    user: storedUser,
                    accessToken: 'test-access',
                    refreshToken: 'test-refresh'
                },
                version: 0
            }));
        }, mockUser);
        const importJob = {
            id: 'mock-import',
            sourceName: 'sample-clean.csv',
            totalRows: 3,
            successCount: 3,
            failureCount: 0,
            status: 'COMPLETED',
            createdAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            createdBy: { id: mockUser.id, email: mockUser.email }
        };
        await page.route('**/api/imports', async (route) => {
            const url = new URL(route.request().url());
            if (!/\/api\/imports$/.test(url.pathname)) {
                await route.continue();
                return;
            }
            if (route.request().method() === 'GET') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        message: 'Imports fetched',
                        data: {
                            imports: [importJob],
                            pageSize: 5,
                            total: 1,
                            hasNext: false,
                            nextCursor: null
                        }
                    })
                });
                return;
            }
            await route.fulfill({
                status: 201,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    message: 'Import created',
                    data: importJob
                })
            });
        });
        await page.route(/\/api\/imports\/[^/]+\/chunks$/, async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    message: 'Chunk processed',
                    data: { successCount: 3, failureCount: 0, createdCount: 3, updatedCount: 0 }
                })
            });
        });
        await page.route(/\/api\/imports\/[^/]+$/, async (route) => {
            const url = new URL(route.request().url());
            if (url.pathname.endsWith('/chunks')) {
                await route.continue();
                return;
            }
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    message: 'Import details fetched',
                    data: {
                        ...importJob,
                        errors: [],
                        audits: [
                            { id: 'audit-1', action: 'IMPORT_COMPLETED', createdAt: new Date().toISOString(), metadata: { successCount: 3 } }
                        ]
                    }
                })
            });
        });
        await page.route('**/api/cases*', async (route) => {
            const url = new URL(route.request().url());
            const limit = Number(url.searchParams.get('limit') ?? '5');
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    message: 'Cases fetched',
                    data: { cases: [], pageSize: limit, total: 0, hasNext: false, nextCursor: null }
                })
            });
        });
        await page.goto('/import');
        await page.getByLabel('Upload CSV').setInputFiles(sampleCsv);
        await expect(page.getByText(/sample-clean\.csv/i)).toBeVisible();
        await page.getByRole('button', { name: /Validate rows/i }).click();
        await expect(page.getByText(/Valid rows:/)).toBeVisible();
        await page.getByRole('button', { name: /Submit/i }).click();
        await expect(page.getByRole('heading', { name: /Import report/i })).toBeVisible();
        await expect(page.getByText(/Upload progress/i)).toBeVisible();
    });
});
