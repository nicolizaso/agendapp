import time
from playwright.sync_api import sync_playwright

def test_points():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:5173/")
        time.sleep(2)

        # Open Create Task Modal
        page.locator(".fixed.bottom-6.right-6").click()
        time.sleep(1)

        # Check if the points input is present
        points_input = page.locator("input[placeholder='10']")
        print("Points input visible:", points_input.is_visible())

        page.screenshot(path="verification/test_points.png")
        print("Done")

        browser.close()

if __name__ == "__main__":
    test_points()
