from playwright.sync_api import sync_playwright, expect
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.goto("http://localhost:5173")
        page.wait_for_selector("text=Pipa's Journal", timeout=10000)

        # Click FAB
        page.locator("button.fixed.bottom-6.right-6").click()

        # Fill title
        page.locator("input[placeholder='Ej: Entrenar pierna']").fill("Test Task for Agenda Modal")

        # Click create button
        page.locator("button", has_text="Crear Tarea").click()

        page.wait_for_timeout(2000)

        # Open Agenda Modal
        print("Taking pre-click screenshot...")
        page.screenshot(path="verification/pre_click.png")

        agenda_btn = page.locator("button:has(svg.lucide-clipboard-list)").first
        print(f"Agenda button found: {agenda_btn.count()}")
        agenda_btn.click()

        page.wait_for_timeout(2000)
        print("Taking post-click screenshot...")
        page.screenshot(path="verification/post_click.png")

        browser.close()

if __name__ == "__main__":
    run()
