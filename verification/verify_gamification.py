import time
from playwright.sync_api import sync_playwright

def test_gamification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:5174/")
        time.sleep(2)

        # Go to Gamification Tab
        page.evaluate("() => { const store = Array.from(document.querySelectorAll('button')).find(el => el.textContent.includes('Shop')); if(store) store.click(); }")
        time.sleep(2)

        # Alternatively, find the settings modal open button and click the gamification entry.
        # But App.tsx no longer shows the "gamification" tab explicitly in the UI desktop nav.
        # Let's check the source.

        page.screenshot(path="verification/gamification_test.png")
        print("Done capturing Gamification Dashboard")

        browser.close()

if __name__ == "__main__":
    test_gamification()
