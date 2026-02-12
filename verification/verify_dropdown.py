from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # iPhone 12 viewport
        context = browser.new_context(viewport={'width': 390, 'height': 844})
        page = context.new_page()

        print("Navigating...")
        page.goto("http://localhost:5173")
        try:
            page.wait_for_load_state("networkidle", timeout=10000)
        except:
            print("Network idle timeout, proceeding...")

        print("Clicking Create button...")
        # The button has aria-label="Crear"
        try:
            page.get_by_label("Crear").click(timeout=5000)
        except Exception as e:
            print(f"Failed to click via label: {e}")
            # Fallback: try finding button with PlusCircle icon
            # PlusCircle usually has class 'lucide-plus-circle'
            print("Trying fallback via icon selector...")
            page.locator("svg.lucide-plus-circle").locator("..").click()

        print("Waiting for modal...")
        page.wait_for_selector("text=Nueva Tarea", timeout=5000)

        print("Opening dropdown...")
        # Trigger is a button with text "Sin categoría"
        # Wait for hydration/animation
        page.wait_for_timeout(500)
        page.get_by_text("Sin categoría").click()

        print("Waiting for options...")
        page.wait_for_selector("text=Casa", timeout=5000)

        # Wait for rendering
        page.wait_for_timeout(500)

        print("Taking screenshot...")
        page.screenshot(path="verification/mobile_dropdown.png")
        browser.close()
        print("Done.")

if __name__ == "__main__":
    run()
