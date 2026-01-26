from playwright.sync_api import sync_playwright

def verify_app():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            # 1. Dashboard
            print("Navigating to Dashboard...")
            page.goto("http://localhost:5173")
            page.wait_for_selector("text=VectorLife")
            # Wait for animation/load
            page.wait_for_timeout(1000)
            page.screenshot(path="verification/dashboard.png")
            print("Dashboard screenshot taken")

            # 2. Add Task
            print("Navigating to Missions...")
            page.click("button:has-text('Missions')")
            page.wait_for_selector("text=Create New Mission")

            print("Creating Task...")
            page.fill("input[id='title']", "Test Mission Playwright")
            page.select_option("select[id='duration']", "60")
            page.select_option("select[id='effort']", "MEDIUM")

            # Allow UI to update reward preview
            page.wait_for_timeout(500)

            page.click("button:has-text('Add Mission')")

            # Wait for task to appear
            page.wait_for_selector("text=Test Mission Playwright")
            page.screenshot(path="verification/tasks.png")
            print("Tasks screenshot taken")

            # 3. Shop
            print("Navigating to Shop...")
            page.click("button:has-text('Shop')")
            page.wait_for_selector("text=Add New Reward")
            page.wait_for_timeout(500)
            page.screenshot(path="verification/shop.png")
            print("Shop screenshot taken")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_app()
