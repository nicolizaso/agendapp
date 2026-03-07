from playwright.sync_api import sync_playwright, expect
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Mobile viewport to show hamburger menu
        context = browser.new_context(viewport={'width': 375, 'height': 812})
        page = context.new_page()

        page.goto("http://localhost:5173")
        page.wait_for_selector("text=Pipa's Journal", timeout=10000)

        # Click hamburger menu
        page.locator("button:has(svg.lucide-menu)").click()
        page.wait_for_timeout(1000)

        # Click Recompensas in the menu
        page.locator("button:has-text('Recompensas')").click()
        page.wait_for_timeout(1000)

        # Now click Configuración
        page.locator("button:has-text('Configuración')").click()
        page.wait_for_timeout(1000)

        page.screenshot(path="verification/gamification_mobile_success.png")

        expect(page.locator("text=Penalización por tarea no completada (pts)")).to_be_visible()
        expect(page.locator("text=Puntos por Categoría")).to_be_visible()
        expect(page.locator("text=Aún no has creado premios. ¡Crea el primero!")).to_be_visible()

        print("Successfully verified the new Gamification settings UI.")

        browser.close()

if __name__ == "__main__":
    run()
