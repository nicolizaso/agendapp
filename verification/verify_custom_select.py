from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(
        viewport={"width": 390, "height": 844},
        user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1"
    )
    page = context.new_page()

    try:
        print("Navigating to http://localhost:5173")
        page.goto("http://localhost:5173", timeout=30000)

        # Wait for "Crear" button
        create_btn = page.locator('button[aria-label="Crear"]')
        print("Waiting for 'Crear' button...")
        create_btn.wait_for(state="visible", timeout=10000)

        print("Clicking 'Crear' button...")
        create_btn.click()

        # Wait for "Nueva Tarea" modal
        print("Waiting for 'Nueva Tarea' modal...")
        page.locator("text=Nueva Tarea").wait_for(state="visible", timeout=5000)

        # Click category select trigger ("Sin categoría")
        select_trigger = page.get_by_text("Sin categoría")
        print("Clicking category select trigger...")
        select_trigger.click()

        # Wait for dropdown container with z-[9999]
        print("Waiting for dropdown container...")
        dropdown_container = page.locator(".z-\[9999\]")
        dropdown_container.wait_for(state="visible", timeout=5000)

        # Wait for "Gym" option inside the dropdown
        print("Waiting for 'Gym' option in dropdown...")
        gym_option = dropdown_container.get_by_text("Gym")
        gym_option.wait_for(state="visible", timeout=5000)

        # Take screenshot
        print("Taking screenshot...")
        page.screenshot(path="verification/custom_select_mobile.png")
        print("Screenshot saved to verification/custom_select_mobile.png")

    except Exception as e:
        print(f"Error during verification: {e}")
        page.screenshot(path="verification/error.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
