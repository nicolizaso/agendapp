from playwright.sync_api import sync_playwright, expect

def test_grid_layout():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.goto("http://localhost:5173")

        # Wait for TodaySection to load and categories to appear
        page.wait_for_selector("text=Agenda de Hoy")

        # Take a screenshot before expansion
        page.screenshot(path="verification/grid_collapsed.png")

        # Click on the first category to expand it
        first_category_button = page.locator("button.w-full.flex.items-center.justify-between.p-3").first
        if first_category_button.count() > 0:
            first_category_button.click()
            page.wait_for_timeout(500) # wait for animation
            # Take a screenshot after expansion
            page.screenshot(path="verification/grid_expanded.png")

        browser.close()

if __name__ == "__main__":
    test_grid_layout()
