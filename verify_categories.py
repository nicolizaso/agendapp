from playwright.sync_api import sync_playwright, expect

def verify_categories(page):
    print("Navigating to local app...")
    page.goto("http://localhost:5173/")

    # Wait for app to load (checking for Agenda de Hoy title which is present)
    page.wait_for_selector("text=Agenda de Hoy", state="attached", timeout=10000)

    print("Opening settings...")
    # There's a button with a gear icon in the header (the last button)
    # Let's target it via class name or just clicking the last button in a specific region.
    # We can just click the settings button (the gear icon on the top right)
    page.locator('button:has(svg.lucide-settings)').first.click()

    # Wait for modal to open
    expect(page.get_by_text("Gestionar Categorías")).to_be_visible(timeout=5000)

    print("Taking screenshot of default categories...")
    page.screenshot(path="verification/categories_default.png")

    # Create a new category
    print("Clicking Nueva...")
    page.get_by_role("button", name="Nueva").click()

    expect(page.get_by_text("Nombre de la Categoría")).to_be_visible()

    print("Filling form...")
    page.get_by_placeholder("Ej: Proyectos").fill("Super Proyectos")

    # Pick an icon (first available button in the icon grid that isn't selected)
    # Just click any icon button
    page.locator("button[class*='text-neutral-400 hover:bg-neutral-700']").first.click()

    # Pick a color (let's say the 3rd color button)
    page.locator("button[class*='w-8 h-8 rounded-full']").nth(2).click()

    print("Taking screenshot of category form...")
    page.screenshot(path="verification/category_form.png")

    print("Saving category...")
    page.get_by_role("button", name="Crear Categoría").click()

    expect(page.get_by_text("Super Proyectos")).to_be_visible()

    print("Taking final screenshot of new category list...")
    page.screenshot(path="verification/categories_custom.png")

if __name__ == "__main__":
    import os
    os.makedirs("verification", exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_categories(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()
