from playwright.sync_api import Page, expect, sync_playwright
import time

def verify_settings_modal(page: Page):
    try:
        # 1. Go to the app
        page.goto("http://localhost:5173/")

        # Wait for the app to load
        page.wait_for_selector('img[alt="Logo Pipa\'s Journal"]')
        time.sleep(1)

        # 2. Click on the Settings button
        # Let's take a screenshot before clicking to see the button
        page.screenshot(path="verification/before_click.png")

        print("Clicking settings button...")
        # nav buttons: Dashboard, Tasks, Settings
        page.locator("nav button").nth(2).click()

        time.sleep(1) # Wait for animation

        # 3. Assert Modal is open by checking text
        print("Checking for 'Configuración'...")
        expect(page.get_by_text("Configuración")).to_be_visible()

        # 4. Check for Danger Zone
        expect(page.get_by_text("Zona de Peligro / Datos")).to_be_visible()

        # 5. Check for Buttons
        expect(page.get_by_role("button", name="Exportar Copia de Seguridad")).to_be_visible()
        expect(page.get_by_role("button", name="Restaurar Copia de Seguridad")).to_be_visible()

        # 6. Screenshot
        page.screenshot(path="verification/settings_modal.png")
        print("Success!")

    except Exception as e:
        print(f"Error: {e}")
        page.screenshot(path="verification/error.png")
        raise e

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_settings_modal(page)
        finally:
            browser.close()
